import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { EstadoPill } from "@/components/reserva-ui";

const MODO_LABEL: Record<string, string> = { sala: "Sala", ping_pong: "Ping Pong" };

function rango(inicio: string, fin: string) {
  const o: Intl.DateTimeFormatOptions = { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" };
  return `${new Date(inicio).toLocaleTimeString("es-ES", o)}–${new Date(fin).toLocaleTimeString("es-ES", o)}`;
}
function fecha(inicio: string) {
  return new Date(inicio).toLocaleDateString("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function Page() {
  const session = await getSessionUser();
  const supabase = await createClient();
  const ahora = new Date().toISOString();

  const [{ data: proximas }, { data: historial }] = await Promise.all([
    supabase
      .from("reservas")
      .select("id, modo, inicio, fin, estado, aprobacion, importe_cent")
      .eq("vivienda_id", session!.perfil!.vivienda_id!)
      .gte("fin", ahora)
      .not("estado", "in", "(cancelada,caducada)")
      .order("inicio", { ascending: true }),
    supabase
      .from("reservas")
      .select("id, modo, inicio, fin, estado, aprobacion")
      .eq("vivienda_id", session!.perfil!.vivienda_id!)
      .or(`fin.lt.${ahora},estado.in.(cancelada,caducada)`)
      .order("inicio", { ascending: false })
      .limit(30),
  ]);

  return (
    <main className="flex h-full flex-col">
      <header className="shrink-0 px-5 pb-3 pt-6">
        <h1 className="text-xl font-semibold">Mis reservas</h1>
        <p className="text-sm text-ink-2">Vivienda · todas las personas</p>
      </header>

      <div className="scroll-area min-h-0 flex-1 space-y-5 px-5 pb-6 pt-1">
      <Section title="Próximas">
        {(proximas ?? []).length === 0 ? (
          <Empty>No tienes reservas próximas.</Empty>
        ) : (
          proximas!.map((r) => (
            <Card key={r.id} r={r} />
          ))
        )}
      </Section>

      <Section title="Historial">
        {(historial ?? []).length === 0 ? (
          <Empty>Todavía no hay reservas anteriores.</Empty>
        ) : (
          historial!.map((r) => <Card key={r.id} r={r} />)
        )}
      </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[.09em] text-ink-3">
        {title}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-4 text-sm text-ink-3">
      {children}
    </div>
  );
}

type ReservaCard = {
  id: string;
  modo: string;
  inicio: string;
  fin: string;
  estado: string;
  aprobacion: string;
};

function Card({ r }: { r: ReservaCard }) {
  return (
    <Link
      href={`/reserva/${r.id}`}
      className="block rounded-xl border border-line bg-surface p-4"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">{MODO_LABEL[r.modo]}</span>
        <EstadoPill estado={r.estado} aprobacion={r.aprobacion} />
      </div>
      <div className="mt-1 text-sm text-ink-2">
        {fecha(r.inicio)} · {rango(r.inicio, r.fin)}
      </div>
    </Link>
  );
}
