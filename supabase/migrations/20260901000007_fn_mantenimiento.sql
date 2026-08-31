-- Crear un bloqueo de mantenimiento a partir de fecha + horas (Europe/Madrid).

create or replace function public.crear_mantenimiento(
  p_espacio uuid, p_fecha date, p_hi int, p_hf int, p_motivo text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ini timestamptz;
  v_fin timestamptz;
  v_id  uuid;
begin
  if not public.es_admin() then raise exception 'NO_ADMIN'; end if;
  if p_hf <= p_hi then raise exception 'HORARIO'; end if;

  v_ini := (p_fecha::text || ' ' || lpad(p_hi::text, 2, '0') || ':00:00')::timestamp at time zone 'Europe/Madrid';
  v_fin := (p_fecha::text || ' ' || lpad(p_hf::text, 2, '0') || ':00:00')::timestamp at time zone 'Europe/Madrid';

  insert into public.bloqueos_mantenimiento (espacio_id, inicio, fin, durante, motivo, creado_por)
  values (p_espacio, v_ini, v_fin, tstzrange(v_ini, v_fin, '[)'), p_motivo, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;
grant execute on function public.crear_mantenimiento(uuid, date, int, int, text) to authenticated;
