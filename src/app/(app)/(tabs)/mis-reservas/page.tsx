import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { EstadoPill } from "@/components/reserva-ui";

const LOC: Record<string, string> = { es: "es-ES", en: "en-GB" };

export default async function Page() {
  const session = await getSessionUser();
  const supabase = await createClient();
  const t = await getTranslations("myBookings");
  const tSpace = await getTranslations("space");
  const loc = LOC[await getLocale()] ?? "es-ES";
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

  const fecha = (iso: string) =>
    new Date(iso).toLocaleDateString(loc, {
      timeZone: "Europe/Madrid",
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  const rango = (i: string, f: string) => {
    const o: Intl.DateTimeFormatOptions = { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" };
    return `${new Date(i).toLocaleTimeString(loc, o)}–${new Date(f).toLocaleTimeString(loc, o)}`;
  };

  const Card = ({ r }: { r: ReservaCard }) => (
    <Link href={`/reserva/${r.id}`} className="block rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{tSpace(r.modo as "sala")}</span>
        <EstadoPill estado={r.estado} aprobacion={r.aprobacion} />
      </div>
      <div className="mt-1 text-sm text-ink-2">
        {fecha(r.inicio)} · {rango(r.inicio, r.fin)}
      </div>
    </Link>
  );

  return (
    <main className="flex h-full flex-col">
      <header className="shrink-0 px-5 pb-3 pt-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-ink-2">{t("subtitle")}</p>
      </header>

      <div className="scroll-area min-h-0 flex-1 space-y-5 px-5 pb-6 pt-1">
        <Section title={t("upcoming")}>
          {(proximas ?? []).length === 0 ? (
            <Empty>{t("emptyUpcoming")}</Empty>
          ) : (
            proximas!.map((r) => <Card key={r.id} r={r} />)
          )}
        </Section>

        <Section title={t("history")}>
          {(historial ?? []).length === 0 ? (
            <Empty>{t("emptyHistory")}</Empty>
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
      <div className="text-xs font-semibold uppercase tracking-[.09em] text-ink-3">{title}</div>
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
