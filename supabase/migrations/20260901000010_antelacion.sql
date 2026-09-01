-- Fase 4 · Plazo de antelación configurable por espacio.
-- Sala: 30 días por defecto. Ping Pong: 7. Editable por el administrador.

alter table public.tarifas
  add column if not exists dias_antelacion integer not null default 7
    check (dias_antelacion between 1 and 120);

update public.tarifas t
set dias_antelacion = 30
from public.espacios e
where t.espacio_id = e.id and e.clave = 'sala' and t.modo = 'sala';

-- ---------------------------------------------------------------------------
-- crear_reserva: usa el plazo de antelación del modo en vez del 7 fijo.
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
  v_dias       int;
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

  select id into v_espacio from public.espacios where clave = 'sala';

  select dias_antelacion into v_dias
  from public.tarifas where espacio_id = v_espacio and modo = p_modo;
  v_dias := coalesce(v_dias, 7);

  if p_fecha < v_hoy or p_fecha > v_hoy + v_dias then raise exception 'FECHA'; end if;
  if not public.reserva_horario_valido(p_modo, p_hi, p_hf) then raise exception 'HORARIO'; end if;
  if p_tipo = 'junta' and p_modo <> 'sala' then raise exception 'JUNTA_SOLO_SALA'; end if;

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
