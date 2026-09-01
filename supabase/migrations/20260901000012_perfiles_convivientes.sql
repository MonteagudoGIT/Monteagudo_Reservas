-- Fase 4 · Los convivientes (misma vivienda) ven el nombre unos de otros,
-- para poder mostrar "quién reservó" en las tarjetas de reserva.

create or replace function public.mi_vivienda()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select vivienda_id from public.perfiles where id = auth.uid()
$$;
grant execute on function public.mi_vivienda() to authenticated;

create policy "perfiles_select_convivientes" on public.perfiles
  for select using (
    vivienda_id is not null and vivienda_id = public.mi_vivienda()
  );
