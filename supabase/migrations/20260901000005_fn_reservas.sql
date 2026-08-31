-- Fase 4 · Lógica de reservas en el servidor (una sola fuente de verdad).

create or replace function public.reserva_horario_valido(
  p_modo public.modo_reserva, p_hi int, p_hf int
) returns boolean
language sql immutable as $$
  select
    p_hf > p_hi
    and (
      (p_hi >= 10 and p_hf <= 15)
      or (p_hi >= 17 and p_hf <= 23)
      or (p_modo = 'sala' and p_hi = 10 and p_hf = 23)
    )
    and (p_modo = 'sala' or p_hf - p_hi <= 2);
$$;

-- ---------------------------------------------------------------------------
-- Crear reserva. Devuelve el id.
-- Códigos de error (en el mensaje):
--   IMPAGO · FECHA · HORARIO · PASADO · SALDO · NO_ADMIN · OCUPADO · SIN_VIVIENDA · JUNTA_SOLO_SALA
-- ---------------------------------------------------------------------------
create or replace function public.crear_reserva(
  p_modo   public.modo_reserva,
  p_fecha  date,
  p_hi     int,
  p_hf     int,
  p_metodo public.metodo_pago,
  p_vivienda uuid default null,
  p_tipo   public.tipo_reserva default 'normal'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid        uuid := auth.uid();
  v_admin      boolean := public.es_admin();
  v_vivienda   uuid;
  v_espacio    uuid;
  v_hoy        date := (now() at time zone 'Europe/Madrid')::date;
  v_inicio     timestamptz;
  v_fin        timestamptz;
  v_precio     int;
  v_estado     public.estado_reserva;
  v_aprob      public.estado_aprobacion := 'no_requerida';
  v_retenida   timestamptz;
  v_confirmada timestamptz;
  v_metodo     public.metodo_pago := p_metodo;
  v_es_admin_por_otro boolean;
  v_id         uuid;
begin
  v_es_admin_por_otro := (p_vivienda is not null and v_admin);

  if v_es_admin_por_otro then
    v_vivienda := p_vivienda;
  else
    select vivienda_id into v_vivienda from public.perfiles where id = v_uid;
  end if;
  if v_vivienda is null then raise exception 'SIN_VIVIENDA'; end if;

  -- Impago: nadie reserva. Se registra el intento.
  if (select bloqueada from public.viviendas where id = v_vivienda) then
    insert into public.intentos_bloqueados (vivienda_id, usuario_id, detalle)
    values (v_vivienda, v_uid, format('%s %s %s-%s', p_modo, p_fecha, p_hi, p_hf));
    raise exception 'IMPAGO';
  end if;

  if p_fecha < v_hoy or p_fecha > v_hoy + 7 then raise exception 'FECHA'; end if;
  if not public.reserva_horario_valido(p_modo, p_hi, p_hf) then raise exception 'HORARIO'; end if;
  if p_tipo = 'junta' and p_modo <> 'sala' then raise exception 'JUNTA_SOLO_SALA'; end if;

  select id into v_espacio from public.espacios where clave = 'sala';

  v_inicio := (p_fecha::text || ' ' || lpad(p_hi::text, 2, '0') || ':00:00')::timestamp at time zone 'Europe/Madrid';
  v_fin    := (p_fecha::text || ' ' || lpad(p_hf::text, 2, '0') || ':00:00')::timestamp at time zone 'Europe/Madrid';
  if v_inicio <= now() then raise exception 'PASADO'; end if;

  if exists (
    select 1 from public.bloqueos_mantenimiento
    where espacio_id = v_espacio and durante && tstzrange(v_inicio, v_fin, '[)')
  ) then
    raise exception 'MANTENIMIENTO';
  end if;

  -- ---- Reserva de junta de vecinos: gratuita, con visto bueno de administración ----
  if p_tipo = 'junta' then
    v_precio := 0;
    v_metodo := null;
    v_estado := 'confirmada';
    v_confirmada := now();
    v_aprob := case when v_admin then 'no_requerida' else 'pendiente' end;

  -- ---- Reserva normal ----
  else
    select precio_cent into v_precio
    from public.tarifas where espacio_id = v_espacio and modo = p_modo;
    v_precio := coalesce(v_precio, 0);

    if v_metodo = 'transferencia' then
      v_estado := 'retenida';
      v_retenida := now() + interval '3 days';
    elsif v_metodo = 'saldo' then
      if public.saldo_vivienda(v_vivienda) < v_precio then raise exception 'SALDO'; end if;
      v_estado := 'confirmada';
      v_confirmada := now();
    elsif v_metodo = 'gestion_admin' then
      if not v_admin then raise exception 'NO_ADMIN'; end if;
      v_estado := 'confirmada';
      v_confirmada := now();
    else
      raise exception 'HORARIO';
    end if;

    -- ¿Este modo exige visto bueno de administración?
    if not v_admin and (select requiere_aprobacion from public.tarifas where espacio_id = v_espacio and modo = p_modo) then
      v_aprob := 'pendiente';
    end if;
  end if;

  begin
    insert into public.reservas (
      espacio_id, vivienda_id, usuario_id, modo, tipo_reserva, fecha, inicio, fin, durante,
      estado, aprobacion, importe_cent, metodo_pago, retenida_hasta, confirmada_en,
      creada_por, creada_por_admin
    ) values (
      v_espacio, v_vivienda,
      case when v_es_admin_por_otro then null else v_uid end,
      p_modo, p_tipo, p_fecha, v_inicio, v_fin, tstzrange(v_inicio, v_fin, '[)'),
      v_estado, v_aprob, v_precio, v_metodo, v_retenida, v_confirmada,
      v_uid, v_es_admin_por_otro
    )
    returning id into v_id;
  exception when exclusion_violation then
    raise exception 'OCUPADO';
  end;

  if v_metodo = 'saldo' then
    insert into public.saldo_movimientos (vivienda_id, tipo, importe_cent, reserva_id, motivo, creado_por)
    values (v_vivienda, 'consumo', v_precio, v_id, 'Reserva pagada con saldo', v_uid);
  end if;

  return v_id;
end;
$$;
grant execute on function public.crear_reserva(public.modo_reserva, date, int, int, public.metodo_pago, uuid, public.tipo_reserva) to authenticated;

-- ---------------------------------------------------------------------------
-- Cancelar (NO_PERMISO · ESTADO · TARDE)
-- ---------------------------------------------------------------------------
create or replace function public.cancelar_reserva(p_id uuid, p_motivo text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_admin  boolean := public.es_admin();
  r        public.reservas%rowtype;
  v_mi_viv uuid;
begin
  select * into r from public.reservas where id = p_id;
  if not found then raise exception 'NO_PERMISO'; end if;

  select vivienda_id into v_mi_viv from public.perfiles where id = v_uid;
  if not v_admin and r.vivienda_id is distinct from v_mi_viv then raise exception 'NO_PERMISO'; end if;
  if r.estado not in ('retenida', 'confirmada', 'pendiente_aprobacion') then raise exception 'ESTADO'; end if;
  if not v_admin and r.inicio - now() < interval '1 hour' then raise exception 'TARDE'; end if;

  if r.estado = 'confirmada' and r.importe_cent > 0 and r.metodo_pago in ('transferencia', 'saldo') then
    insert into public.saldo_movimientos (vivienda_id, tipo, importe_cent, reserva_id, motivo, creado_por)
    values (r.vivienda_id, 'abono', r.importe_cent, r.id, 'Devolución por cancelación', v_uid);
  end if;

  update public.reservas
  set estado = 'cancelada', cancelada_en = now(), cancelada_por = v_uid, cancelada_motivo = p_motivo
  where id = p_id;
end;
$$;
grant execute on function public.cancelar_reserva(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Validar transferencia (admin): retenida -> confirmada
-- ---------------------------------------------------------------------------
create or replace function public.validar_transferencia(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.es_admin() then raise exception 'NO_ADMIN'; end if;
  update public.reservas
  set estado = 'confirmada', confirmada_en = now(), retenida_hasta = null
  where id = p_id and estado = 'retenida';
  if not found then raise exception 'ESTADO'; end if;
end;
$$;
grant execute on function public.validar_transferencia(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Aprobar / rechazar (admin) — visto bueno de administración
-- ---------------------------------------------------------------------------
create or replace function public.aprobar_reserva(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.es_admin() then raise exception 'NO_ADMIN'; end if;
  update public.reservas set aprobacion = 'aprobada'
  where id = p_id and aprobacion = 'pendiente';
  if not found then raise exception 'ESTADO'; end if;
end;
$$;
grant execute on function public.aprobar_reserva(uuid) to authenticated;

create or replace function public.rechazar_reserva(p_id uuid, p_motivo text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare r public.reservas%rowtype;
begin
  if not public.es_admin() then raise exception 'NO_ADMIN'; end if;
  select * into r from public.reservas where id = p_id and aprobacion = 'pendiente';
  if not found then raise exception 'ESTADO'; end if;

  if r.estado = 'confirmada' and r.importe_cent > 0 and r.metodo_pago in ('transferencia', 'saldo') then
    insert into public.saldo_movimientos (vivienda_id, tipo, importe_cent, reserva_id, motivo, creado_por)
    values (r.vivienda_id, 'abono', r.importe_cent, r.id, 'Reserva rechazada por administración', auth.uid());
  end if;

  update public.reservas
  set aprobacion = 'rechazada', estado = 'cancelada', cancelada_en = now(),
      cancelada_por = auth.uid(), cancelada_motivo = coalesce(p_motivo, 'Rechazada por administración')
  where id = p_id;
end;
$$;
grant execute on function public.rechazar_reserva(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Caducar reservas retenidas vencidas (tarea programada)
-- ---------------------------------------------------------------------------
create or replace function public.caducar_retenidas()
returns integer
language plpgsql security definer set search_path = public
as $$
declare v_n integer;
begin
  update public.reservas
  set estado = 'caducada'
  where estado = 'retenida' and retenida_hasta is not null and retenida_hasta < now();
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
