-- Fase 4 (add.) · Aprobación diferida + reserva de junta de vecinos
-- Pedido por el cliente.
--
-- Modelo: la aprobación es ORTOGONAL al estado de pago.
--   estado      -> ciclo de vida / pago (retenida, confirmada, cancelada, caducada, completada)
--   aprobacion  -> visto bueno de administración (no_requerida, pendiente, aprobada, rechazada)
-- Una reserva es EFECTIVA solo si estado='confirmada' y aprobacion in ('no_requerida','aprobada').

create type public.tipo_reserva       as enum ('normal', 'junta');
create type public.estado_aprobacion  as enum ('no_requerida', 'pendiente', 'aprobada', 'rechazada');

alter table public.reservas
  add column tipo_reserva public.tipo_reserva      not null default 'normal',
  add column aprobacion   public.estado_aprobacion not null default 'no_requerida';

-- El administrador puede exigir su visto bueno para las reservas de un modo (p. ej. la Sala).
alter table public.tarifas
  add column requiere_aprobacion boolean not null default false;

-- El hueco queda retenido también mientras espera aprobación; se libera si se rechaza.
alter table public.reservas drop constraint reservas_no_solape;
alter table public.reservas
  add constraint reservas_no_solape
  exclude using gist (espacio_id with =, durante with &&)
  where (estado in ('retenida', 'confirmada', 'completada') and aprobacion <> 'rechazada');
