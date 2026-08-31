"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { horaMadrid } from "@/lib/reservas";

type Reserva = {
  id: string;
  modo: string;
  fecha: string;
  inicio: string;
  fin: string;
  vivienda_id: string;
  estado: string;
  aprobacion: string;
};
type Mant = { inicio: string; fin: string; motivo: string | null };

const HORAS = [10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 22];
const DOW = ["L", "M", "X", "J", "V", "S", "D"];

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function addMonths(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}
function lunesDe(iso: string) {
  const d = new Date(iso + "T12:00:00Z");
  return addDays(iso, -((d.getUTCDay() + 6) % 7));
}
function semanaDe(iso: string) {
  const l = lunesDe(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(l, i));
}
function celdasMes(iso: string) {
  const d = new Date(iso + "T12:00:00Z");
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const offset = (new Date(Date.UTC(y, m, 1, 12)).getUTCDay() + 6) % 7;
  const total = new Date(Date.UTC(y, m + 1, 0, 12)).getUTCDate();
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let dd = 1; dd <= total; dd++)
    cells.push(`${y}-${String(m + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
function fmt(iso: string, o: Intl.DateTimeFormatOptions) {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("es-ES", { timeZone: "UTC", ...o });
}

export default function CalendarioCliente({
  reservas,
  mantenimiento,
  miVivienda,
  hoy,
}: {
  reservas: Reserva[];
  mantenimiento: Mant[];
  miVivienda: string;
  hoy: string;
}) {
  const [vista, setVista] = useState<"dia" | "semana" | "mes">("semana");
  const [ref, setRef] = useState<string>(hoy);

  const porFecha = useMemo(() => {
    const map = new Map<string, Reserva[]>();
    for (const r of reservas) {
      const arr = map.get(r.fecha) ?? [];
      arr.push(r);
      map.set(r.fecha, arr);
    }
    return map;
  }, [reservas]);

  const mantPorFecha = useMemo(() => {
    const map = new Map<string, Mant[]>();
    for (const m of mantenimiento) {
      const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(
        new Date(m.inicio),
      );
      const arr = map.get(f) ?? [];
      arr.push(m);
      map.set(f, arr);
    }
    return map;
  }, [mantenimiento]);

  function puntos(fecha: string) {
    const rs = porFecha.get(fecha) ?? [];
    return {
      sala: rs.some((r) => r.modo === "sala"),
      ping: rs.some((r) => r.modo === "ping_pong"),
    };
  }

  const reservable = (fecha: string) => fecha >= hoy && fecha <= addDays(hoy, 7);

  const step = (n: number) =>
    setRef(vista === "mes" ? addMonths(ref, n) : vista === "semana" ? addDays(ref, n * 7) : addDays(ref, n));

  const rotulo =
    vista === "mes"
      ? fmt(ref, { month: "long", year: "numeric" })
      : vista === "semana"
        ? `${fmt(lunesDe(ref), { day: "numeric" })}–${fmt(addDays(lunesDe(ref), 6), { day: "numeric", month: "short" })}`
        : fmt(ref, { weekday: "long", day: "numeric", month: "long" });

  return (
    <main className="flex flex-col px-5 pb-6 pt-6">
      {/* ---- Cabecera fija ---- */}
      <div className="sticky top-0 z-10 -mx-5 bg-ground px-5 pb-3">
        <h1 className="text-xl font-semibold">Calendario</h1>

        <div className="mt-3 flex rounded-lg bg-surface-2 p-0.5">
          {(["dia", "semana", "mes"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={
                "flex-1 rounded-md py-1.5 text-[13px] font-semibold capitalize " +
                (vista === v ? "bg-surface text-ink shadow-sm" : "text-ink-2")
              }
            >
              {v === "dia" ? "Día" : v}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button onClick={() => step(-1)} className="flex size-8 items-center justify-center rounded-lg border border-line-strong bg-surface">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <span className="font-mono text-[13px] capitalize text-ink-2">{rotulo}</span>
          <button onClick={() => step(1)} className="flex size-8 items-center justify-center rounded-lg border border-line-strong bg-surface">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {vista === "semana" && (
          <div className="mt-3 flex justify-between">
            {semanaDe(ref).map((f) => {
              const p = puntos(f);
              const sel = f === ref;
              return (
                <button
                  key={f}
                  onClick={() => setRef(f)}
                  className={
                    "flex w-10 flex-col items-center gap-1 rounded-xl border py-1.5 " +
                    (sel ? "border-2 border-accent bg-accent-soft" : "border-line bg-surface")
                  }
                >
                  <span className="text-[10px] text-ink-3">{DOW[(new Date(f + "T12:00:00Z").getUTCDay() + 6) % 7]}</span>
                  <span className="text-sm font-semibold">{fmt(f, { day: "numeric" })}</span>
                  <span className="flex h-1.5 gap-0.5">
                    {p.sala && <span className="size-1.5 rounded-full bg-accent" />}
                    {p.ping && <span className="size-1.5 rounded-full bg-amber" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Cuerpo ---- */}
      {vista === "mes" ? (
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-ink-3">
            {DOW.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {celdasMes(ref).map((f, i) =>
              f == null ? (
                <span key={i} />
              ) : (
                <button
                  key={f}
                  onClick={() => {
                    setRef(f);
                    setVista("dia");
                  }}
                  className={
                    "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-[13px] " +
                    (f === hoy
                      ? "border-2 border-accent font-bold"
                      : reservable(f)
                        ? "border border-line bg-surface font-semibold"
                        : "border border-dashed border-line bg-surface-2 text-ink-3")
                  }
                >
                  {fmt(f, { day: "numeric" })}
                  <span className="flex h-1 gap-0.5">
                    {puntos(f).sala && <span className="size-1 rounded-full bg-accent" />}
                    {puntos(f).ping && <span className="size-1 rounded-full bg-amber" />}
                  </span>
                </button>
              ),
            )}
          </div>
          <p className="mt-2 text-[11px] text-ink-3">
            Solo se puede reservar hasta 7 días vista. Toca un día para ver la disponibilidad.
          </p>
        </div>
      ) : (
        <Timeline
          fecha={ref}
          reservas={porFecha.get(ref) ?? []}
          mant={mantPorFecha.get(ref) ?? []}
          miVivienda={miVivienda}
          reservable={reservable(ref)}
        />
      )}

      <Link
        href="/reservar"
        className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Reservar
      </Link>
    </main>
  );
}

function Timeline({
  fecha,
  reservas,
  mant,
  miVivienda,
  reservable,
}: {
  fecha: string;
  reservas: Reserva[];
  mant: Mant[];
  miVivienda: string;
  reservable: boolean;
}) {
  function cubre(items: { inicio: string; fin: string }[], h: number) {
    return items.find((x) => {
      const hi = horaMadrid(x.inicio);
      let hf = horaMadrid(x.fin);
      if (hf === 0) hf = 24;
      return h >= hi && h < hf;
    });
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
      {HORAS.map((h, idx) => {
        const r = cubre(reservas, h) as Reserva | undefined;
        const m = cubre(mant, h) as Mant | undefined;
        return (
          <div key={h}>
            {h === 17 && (
              <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-xs text-ink-3 [background:repeating-linear-gradient(135deg,var(--surface),var(--surface)_7px,var(--surface-2)_7px,var(--surface-2)_14px)]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>
                Cerrado · siesta 15:00 – 17:00
              </div>
            )}
            <div className={"flex gap-3 px-3 py-2.5 " + (idx < HORAS.length - 1 ? "border-b border-line" : "")}>
              <span className="w-11 pt-0.5 font-mono text-xs text-ink-3">{String(h).padStart(2, "0")}:00</span>
              <div className="flex-1">
                {m ? (
                  <div className="rounded-md border-l-[3px] border-ink-3 bg-surface-2 px-2.5 py-1.5 text-xs text-ink-2">
                    Mantenimiento{m.motivo ? ` · ${m.motivo}` : ""}
                  </div>
                ) : r ? (
                  <div
                    className={
                      "rounded-md border-l-[3px] px-2.5 py-1.5 text-xs " +
                      (r.modo === "ping_pong" ? "border-amber bg-amber-soft" : "border-accent bg-accent-soft")
                    }
                  >
                    <span className="font-semibold">
                      {r.modo === "ping_pong" ? "Ping Pong" : "Sala"}
                      {r.vivienda_id === miVivienda ? " · tú" : ""}
                    </span>
                  </div>
                ) : reservable ? (
                  <Link
                    href={`/reservar?fecha=${fecha}&hi=${h}`}
                    className="flex items-center justify-between rounded-md border border-dashed border-line-strong px-2.5 py-1.5 text-xs text-ink-2"
                  >
                    Libre
                    <span className="font-semibold text-accent-ink">Reservar →</span>
                  </Link>
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
  );
}
