import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { formatoEuros } from "@/lib/reservas";
import { EstadoPill, CancelarReserva } from "@/components/reserva-ui";
import { Alert } from "@/components/ui";

const MODO_LABEL: Record<string, string> = { sala: "Sala", ping_pong: "Ping Pong" };
const METODO_LABEL: Record<string, string> = {
  transferencia: "Transferencia",
  saldo: "Saldo de la vivienda",
  gestion_admin: "Gestión del administrador",
};

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString("es-ES", { timeZone: "Europe/Madrid", ...opts });
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nueva?: string }>;
}) {
  const { id } = await params;
  const { nueva } = await searchParams;
  const session = await getSessionUser();
  const supabase = await createClient();

  const { data: r } = await supabase
    .from("reservas")
    .select(
      "id, modo, tipo_reserva, inicio, fin, estado, aprobacion, importe_cent, metodo_pago, referencia_transferencia, retenida_hasta, creada_por_admin",
    )
    .eq("id", id)
    .maybeSingle();

  if (!r) notFound();

  const empezada = new Date(r.inicio).getTime() <= Date.now();
  const faltaMenosDeUnaHora = new Date(r.inicio).getTime() - Date.now() < 3600_000;
  const cancelable =
    ["retenida", "confirmada", "pendiente_aprobacion"].includes(r.estado) &&
    (session!.perfil!.rol === "admin" || (!empezada && !faltaMenosDeUnaHora));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-5 pb-8 pt-5">
      <div className="flex items-center gap-3.5">
        <Link
          href="/mis-reservas"
          className="flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <span className="font-semibold">Detalle de la reserva</span>
      </div>

      {nueva ? <Alert kind="success">Reserva registrada.</Alert> : null}

      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">
            {MODO_LABEL[r.modo]}
            {r.tipo_reserva === "junta" ? " · Junta de vecinos" : ""}
          </span>
          <EstadoPill estado={r.estado} aprobacion={r.aprobacion} />
        </div>
        <dl className="mt-3 flex flex-col gap-1.5 text-sm">
          <Item k="Fecha" v={fmt(r.inicio, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} cap />
          <Item
            k="Horario"
            v={`${fmt(r.inicio, { hour: "2-digit", minute: "2-digit" })} – ${fmt(r.fin, { hour: "2-digit", minute: "2-digit" })}`}
          />
          <Item k="Importe" v={formatoEuros(r.importe_cent)} />
          {r.metodo_pago ? <Item k="Pago" v={METODO_LABEL[r.metodo_pago] ?? r.metodo_pago} /> : null}
        </dl>
      </div>

      {r.estado === "retenida" && r.metodo_pago === "transferencia" ? (
        <div className="rounded-2xl border border-amber/30 bg-amber-soft p-4 text-sm">
          <div className="font-semibold text-amber">Pendiente de tu transferencia</div>
          <p className="mt-1 text-ink-2">
            Haz la transferencia y el administrador confirmará la reserva. Si no llega en 3 días, el
            hueco se libera.
          </p>
        </div>
      ) : null}

      {r.aprobacion === "pendiente" ? (
        <div className="rounded-2xl border border-amber/30 bg-amber-soft p-4 text-sm text-ink-2">
          A la espera del visto bueno del administrador.
        </div>
      ) : null}

      <div className="mt-2 rounded-2xl border border-line bg-surface-2 p-4 text-sm text-ink-2">
        El código de acceso a la sala llegará el día de la reserva (control de acceso, Fase 7).
      </div>

      {cancelable ? <CancelarReserva id={r.id} /> : null}
    </main>
  );
}

function Item({ k, v, cap }: { k: string; v: string; cap?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-2">{k}</dt>
      <dd className={"font-semibold " + (cap ? "capitalize" : "")}>{v}</dd>
    </div>
  );
}
