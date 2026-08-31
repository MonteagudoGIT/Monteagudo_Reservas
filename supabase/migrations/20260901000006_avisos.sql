-- Fase 4 · Avisos (comunicados del administrador hacia los vecinos)

create table public.avisos (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null check (char_length(titulo) between 2 and 160),
  cuerpo       text not null check (char_length(cuerpo) between 2 and 4000),
  publicado    boolean not null default false,
  publicado_en timestamptz,
  creado_por   uuid references auth.users (id) on delete set null,
  creado_en    timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index avisos_pub_idx on public.avisos (publicado, publicado_en desc);

alter table public.avisos enable row level security;

-- Los vecinos ven los publicados; el administrador, todos, y los gestiona.
create policy "avisos_select" on public.avisos
  for select using (publicado or public.es_admin());

create policy "avisos_admin" on public.avisos
  for all using (public.es_admin()) with check (public.es_admin());
