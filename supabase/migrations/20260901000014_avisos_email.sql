-- Fase 4 · Aviso opcional por correo a todos los vecinos.

alter table public.avisos
  add column if not exists enviar_email     boolean not null default false,
  add column if not exists email_enviado_en timestamptz;
