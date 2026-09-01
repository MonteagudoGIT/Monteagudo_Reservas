-- Fase 4 · Cerrar las reservas confirmadas cuya hora ya ha pasado.
-- La invoca la tarea diaria (cron de Vercel), junto a caducar_retenidas().

create or replace function public.completar_reservas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_n integer;
begin
  update public.reservas
  set estado = 'completada'
  where estado = 'confirmada' and fin < now();
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

grant execute on function public.completar_reservas() to service_role;
