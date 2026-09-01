-- Fase 4 · Datos de pago por transferencia (los rellena el administrador).

alter table public.espacios
  add column if not exists iban            text,
  add column if not exists titular_cuenta  text,
  add column if not exists concepto_pago   text;

comment on column public.espacios.concepto_pago is
  'Plantilla del concepto. Admite {espacio}, {fecha} y {vivienda}.';

-- La tarea programada (cron) llama a caducar_retenidas con la service key.
grant execute on function public.caducar_retenidas() to service_role;
