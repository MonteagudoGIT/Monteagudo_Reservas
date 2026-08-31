import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatoEuros } from "@/lib/reservas";
import { VolverPanel } from "@/components/admin-ui";
import { EstadoPill } from "@/components/reserva-ui";

const MODO: Record<string, string> = { sala: "Sala", ping_pong: "Ping Pong" };
const FILTROS = [
  { k: "activas", label: "Activas" },
  { k: "hoy", label: "Hoy" },
  { k: "todas", label: "Todas" },
];

function cuando(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { f } = await searchParams;
  const filtro = FILTROS.some((x) => x.k === f) ? f! : "activas";
  const supabase = await createClient();

  let q = supabase
    .from("reservas")
    .select("id, modo, tipo_reserva, inicio, importe_cent, estado, aprobacion, creada_por_admin, viviendas(etiqueta)")
    .order("inicio", { ascending: false })
    .limit(60);

  if (filtro === "activas") q = q.in("estado", ["retenida", "confirmada"]);
  if (filtro === "hoy") {
    const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
    q = q.eq("fecha", hoy);
  }

  const { data } = await q;

  return (
    <div>
      <VolverPanel />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Reservas</h1>
        <Link
          href="/admin/reservas/nueva"
          className="rounded-lg bg-accent px-3 py-1.5 text-[13px] font-semibold text-white"
        >
          + Nueva
        </Link>
      </div>

      <div className="mt-3 flex gap-2">
        {FILTROS.map((x) => (
          <Link
            key={x.k}
            href={`/admin/reservas?f=${x.k}`}
            className={
              "rounded-lg px-3 py-1.5 text-[13px] font-semibold " +
              (filtro === x.k ? "bg-ink text-surface" : "border border-line bg-surface text-ink-2")
            }
          >
            {x.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {(data ?? []).length === 0 && (
          <p className="rounded-xl border border-line bg-surface px-4 py-4 text-sm text-ink-3">Sin resultados.</p>
        )}
        {(data ?? []).map((r) => {
          const viv = Array.isArray(r.viviendas) ? r.viviendas[0] : r.viviendas;
          return (
            <Link key={r.id} href={`/reserva/${r.id}`} className="block rounded-xl border border-line bg-surface p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {MODO[r.modo]}
                  {r.tipo_reserva === "junta" ? " · Junta" : ""} · {viv?.etiqueta ?? "—"}
                </span>
                <EstadoPill estado={r.estado} aprobacion={r.aprobacion} />
              </div>
              <div className="mt-1 flex items-center justify-between text-sm text-ink-2">
                <span>{cuando(r.inicio)}</span>
                <span className="font-mono">
                  {formatoEuros(r.importe_cent)}
                  {r.creada_por_admin ? " · asistida" : ""}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
