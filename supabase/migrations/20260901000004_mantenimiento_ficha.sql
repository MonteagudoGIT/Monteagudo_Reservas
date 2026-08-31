-- Fase 4 (add.) · Ficha del espacio + bloqueos de mantenimiento
-- Sugerencias recogidas del cliente.

-- ---- Ficha del espacio (fotos: cuando montemos almacenamiento) ----
alter table public.espacios
  add column aforo        integer,
  add column equipamiento text[] not null default '{}',
  add column normas       text;

update public.espacios set
  aforo = 30,
  equipamiento = array['Mesas', 'Sillas', 'Aseo'],
  normas = 'Dejar la sala recogida y las luces apagadas. Respetar el horario reservado y el descanso del mediodía (15:00–17:00).'
where clave = 'sala';
-- aforo y equipamiento son provisionales; los ajusta el administrador.

-- ---- Bloqueos de mantenimiento (el administrador cierra un tramo; no es una reserva) ----
create table public.bloqueos_mantenimiento (
  id         uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references public.espacios (id) on delete cascade,
  inicio     timestamptz not null,
  fin        timestamptz not null,
  durante    tstzrange not null,
  motivo     text,
  creado_por uuid references auth.users (id) on delete set null,
  creado_en  timestamptz not null default now(),
  constraint mant_fin_mayor check (fin > inicio),
  constraint mant_durante_ok check (durante = tstzrange(inicio, fin, '[)'))
);
create index bloqueos_mant_espacio_idx on public.bloqueos_mantenimiento (espacio_id);

alter table public.bloqueos_mantenimiento enable row level security;

create policy "mant_select" on public.bloqueos_mantenimiento
  for select using (auth.role() = 'authenticated');
create policy "mant_admin" on public.bloqueos_mantenimiento
  for all using (public.es_admin()) with check (public.es_admin());
