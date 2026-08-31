-- La protección de rol/estado debe frenar solo a los USUARIOS autenticados no-admin.
-- Las herramientas de servidor (SQL editor, service_role, migraciones) no tienen
-- auth.uid() y deben poder ajustar rol/estado (p. ej. nombrar al primer admin).

create or replace function public.proteger_campos_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.es_admin() then
    new.rol := old.rol;
    new.estado := old.estado;
  end if;
  return new;
end;
$$;
