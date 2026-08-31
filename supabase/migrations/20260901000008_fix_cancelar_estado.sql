-- Corrección: 'pendiente_aprobacion' no es un valor del enum estado_reserva
-- (la aprobación va en la columna 'aprobacion'). Se quita del chequeo.

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
  if r.estado not in ('retenida', 'confirmada') then raise exception 'ESTADO'; end if;
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
