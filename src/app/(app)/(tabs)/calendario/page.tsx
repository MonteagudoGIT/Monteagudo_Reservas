import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { diasReservables, hoyMadridISO, horaMadrid, nombreDiaCorto, nombreDiaLargo } from "@/lib/reservas";

const MODO_LABEL: Record<string, string> = { sala: "Sala", ping_pong: "Ping Pong" };
const HORAS = [10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 22];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const dias = diasReservables();
  const fecha = dias.some((x) => x.iso === d) ? d! : hoyMadridISO();

  const session = await getSessionUser();
  const supabase = await createClient();
  const miVivienda = session!.perfil!.vivienda_id;

  const [{ data: reservas }, { data: mant }] = await Promise.all([
    supabase
      .from("reservas")
      .select("id, modo, inicio, fin, vivienda_id, estado, aprobacion")
      .eq("fecha", fecha)
      .in("estado", ["retenida", "confirmada", "completada"])
      .neq("aprobacion", "rechazada"),
    supabase.from("bloqueos_mantenimiento").select("inicio, fin, motivo"),
  ]);

  const mantDia = (mant ?? []).filter(
    (m) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(m.inicio)) ===
      fecha,
  );

  function ocupaHora(h: number) {
    const r = (reservas ?? []).find((x) => {
      const hi = horaMadrid(x.inicio);
      let hf = horaMadrid(x.fin);
      if (hf === 0) hf = 24;
      return h >= hi && h < hf;
    });
    const m = mantDia.find((x) => {
      const hi = horaMadrid(x.inicio);
      let hf = horaMadrid(x.fin);
      if (hf === 0) hf = 24;
      return h >= hi && h < hf;
    });
    return { r, m };
  }

  return (
    <main className="flex flex-col gap-4 px-5 pb-6 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Calendario</h1>
        <span className="font-mono text-[13px] text-ink-2">
          {new Date(fecha + "T12:00:00Z").toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {dias.map(({ iso }, i) => {
          const { dow, dia } = nombreDiaCorto(iso);
          const sel = iso === fecha;
          return (
            <Link
              key={iso}
              href={`/calendario?d=${iso}`}
              className={
                "flex min-w-11 flex-col items-center gap-1 rounded-xl border px-1.5 py-2 text-xs " +
                (sel ? "border-2 border-accent bg-accent-soft" : "border-line bg-surface")
              }
            >
              <span className="capitalize text-ink-3">{i === 0 ? "hoy" : dow}</span>
              <span className="text-sm font-semibold">{dia}</span>
            </Link>
          );
        })}
      </div>

      <div className="text-[11px] font-semibold uppercase tracking-[.09em] text-ink-3">
        <span className="capitalize">{nombreDiaLargo(fecha)}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {HORAS.map((h, idx) => {
          const { r, m } = ocupaHora(h);
          const siestaAntes = h === 17;
          return (
            <div key={h}>
              {siestaAntes && (
                <div className="flex items-center gap-2 border-b border-line px-3 py-2.5 text-xs text-ink-3 [background:repeating-linear-gradient(135deg,var(--surface),var(--surface)_7px,var(--surface-2)_7px,var(--surface-2)_14px)]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8 12h8" />
                  </svg>
                  Cerrado · siesta 15:00 – 17:00
                </div>
              )}
              <div
                className={
                  "flex items-stretch gap-3 px-3 py-2.5 " +
                  (idx < HORAS.length - 1 ? "border-b border-line" : "")
                }
              >
                <span className="w-11 pt-0.5 font-mono text-xs text-ink-3">
                  {String(h).padStart(2, "0")}:00
                </span>
                <div className="flex-1">
                  {m ? (
                    <div className="rounded-md border-l-[3px] border-ink-3 bg-surface-2 px-2.5 py-1.5 text-xs text-ink-2">
                      Mantenimiento{m.motivo ? ` · ${m.motivo}` : ""}
                    </div>
                  ) : r ? (
                    <div
                      className={
                        "rounded-md border-l-[3px] px-2.5 py-1.5 text-xs " +
                        (r.modo === "ping_pong"
                          ? "border-amber bg-amber-soft"
                          : "border-accent bg-accent-soft")
                      }
                    >
                      <span className="font-semibold">
                        {MODO_LABEL[r.modo]}
                        {r.vivienda_id === miVivienda ? " · tú" : ""}
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-line-strong px-2.5 py-1.5 text-xs text-ink-3">
                      Libre
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href={`/reservar`}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Reservar
      </Link>
    </main>
  );
}
