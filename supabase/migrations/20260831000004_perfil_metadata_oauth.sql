-- El trigger de alta de perfil también aprovecha los datos que da Google
-- (full_name / name / given_name / family_name) para prerrellenar nombre y apellidos.
-- Si entra por Google no habrá vivienda: se pide en /completar-perfil.

create or replace function public.crear_perfil_para_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre    text;
  v_apellidos text;
begin
  v_nombre := coalesce(
    nullif(new.raw_user_meta_data ->> 'nombre', ''),
    nullif(new.raw_user_meta_data ->> 'given_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    ''
  );
  v_apellidos := coalesce(
    nullif(new.raw_user_meta_data ->> 'apellidos', ''),
    nullif(new.raw_user_meta_data ->> 'family_name', ''),
    ''
  );

  insert into public.perfiles (id, nombre, apellidos, vivienda_id, vivienda_texto)
  values (
    new.id,
    v_nombre,
    v_apellidos,
    nullif(new.raw_user_meta_data ->> 'vivienda_id', '')::uuid,
    nullif(new.raw_user_meta_data ->> 'vivienda_texto', '')
  );
  return new;
end;
$$;
