-- El registro ahora envía vivienda_id (desplegable). Actualizamos el trigger
-- para guardar la FK; se mantiene vivienda_texto como alternativa.

create or replace function public.crear_perfil_para_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, apellidos, vivienda_id, vivienda_texto)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'apellidos', ''),
    nullif(new.raw_user_meta_data ->> 'vivienda_id', '')::uuid,
    nullif(new.raw_user_meta_data ->> 'vivienda_texto', '')
  );
  return new;
end;
$$;
