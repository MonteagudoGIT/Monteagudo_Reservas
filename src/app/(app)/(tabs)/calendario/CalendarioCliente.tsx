"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { horaMadrid } from "@/lib/reservas";

const LOC: Record<string, string> = { es: "es-ES", en: "en-GB" };

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

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function addMonths(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z");
  // Anclar al día 1 para no saltar meses cortos (31 ago + 1 mes -> 1 sep, no 1 oct).
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1, 12))
    .toISOString()
    .slice(0, 10);
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
  const offset = (new Date(Date.UTC(y, m, 1, 12)).getUTCDay() + 6) % 7; // 0 = lunes
  const total = new Date(Date.UTC(y, m + 1, 0, 12)).getUTCDate();
  const filas = Math.ceil((offset + total) / 7);
  const inicio = new Date(Date.UTC(y, m, 1 - offset, 12)); // lunes anterior al día 1
  const cells: { iso: string; otro: boolean }[] = [];
  for (let i = 0; i < filas * 7; i++) {
    const c = new Date(inicio);
    c.setUTCDate(inicio.getUTCDate() + i);
    cells.push({ iso: c.toISOString().slice(0, 10), otro: c.getUTCMonth() !== m });
  }
  return cells;
}
function fmtL(iso: string, o: Intl.DateTimeFormatOptions, loc: string) {
  return new Date(iso + "T12:00:00Z").toLocaleDateString(loc, { timeZone: "UTC", ...o });
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
  const t = useTranslations("calendar");
  const loc = LOC[useLocale()] ?? "es-ES";
  const DOW = t.raw("dow") as string[];
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => fmtL(iso, o, loc);

  const [vista, setVista] = useState<"dia" | "semana" | "mes">("mes");
  const [ref, setRef] = useState<string>(hoy);

  // Si cambia el "hoy" del servidor (p. ej. la pestaña sigue abierta al pasar de día),
  // volvemos a hoy.
  useEffect(() => setRef(hoy), [hoy]);

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

  // Ventana amplia (cubre el plazo de la Sala); el asistente valida el límite real por espacio.
  const reservable = (fecha: string) => fecha >= hoy && fecha <= addDays(hoy, 30);

  const step = (n: number) =>
    setRef(vista === "mes" ? addMonths(ref, n) : vista === "semana" ? addDays(ref, n * 7) : addDays(ref, n));

  const rotulo =
    vista === "mes"
      ? fmt(ref, { month: "long", year: "numeric" })
      : vista === "semana"
        ? `${fmt(lunesDe(ref), { day: "numeric" })}–${fmt(addDays(lunesDe(ref), 6), { day: "numeric", month: "short" })}`
        : (ref === hoy ? `${t("today")} · ` : "") +
          fmt(ref, { weekday: "long", day: "numeric", month: "long" });

  return (
    <main className="flex h-full flex-col">
      {/* ---- Cabecera fija ---- */}
      <div className="shrink-0 px-5 pb-2 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <div className="flex rounded-lg bg-surface-2 p-0.5">
            {(["dia", "semana", "mes"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={
                  "rounded-md px-3 py-1 text-xs font-semibold capitalize " +
                  (vista === v ? "bg-surface text-ink shadow-sm" : "text-ink-2")
                }
              >
                {t(v)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <button onClick={() => step(-1)} className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button
            onClick={() => setRef(hoy)}
            className="flex-1 truncate rounded-lg border border-line-strong bg-surface py-1 font-mono text-sm capitalize text-ink-2"
          >
            {ref === hoy ? rotulo : `${rotulo} · ${t("goToday")}`}
          </button>
          <button onClick={() => step(1)} className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {vista === "semana" && (
          <div className="mt-2.5 flex justify-between">
            {semanaDe(ref).map((f) => {
              const p = puntos(f);
              const sel = f === ref;
              return (
                <button
                  key={f}
                  onClick={() => setRef(f)}
                  className={
                    "flex w-10 flex-col items-center gap-1 rounded-xl border py-1.5 " +
                    (sel
                      ? "border-2 border-accent bg-accent-soft"
                      : f === hoy
                        ? "border-accent bg-surface"
                        : "border-line bg-surface")
                  }
                >
                  <span className="text-[0.72rem] text-ink-3">{DOW[(new Date(f + "T12:00:00Z").getUTCDay() + 6) % 7]}</span>
                  <span className={"text-sm font-semibold " + (f === hoy ? "text-accent-ink" : "")}>
                    {fmt(f, { day: "numeric" })}
                  </span>
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

      {/* ---- Cuerpo (scroll) ---- */}
      <div className="scroll-area min-h-0 flex-1 px-5 pb-6 pt-2">
      {vista === "mes" ? (
        <div className="mt-1">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-3">
            {DOW.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {celdasMes(ref).map(({ iso: f, otro }) => (
              <button
                key={f}
                onClick={() => {
                  setRef(f);
                  setVista("dia");
                }}
                className={
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm " +
                  (f === hoy
                    ? "bg-accent font-bold text-white"
                    : reservable(f)
                      ? "border border-line bg-surface font-semibold"
                      : otro
                        ? "text-ink-3/70"
                        : "border border-dashed border-line bg-surface-2 text-ink-3")
                }
              >
                {fmt(f, { day: "numeric" })}
                <span className="flex h-1 gap-0.5">
                  {puntos(f).sala && (
                    <span className={"size-1 rounded-full " + (f === hoy ? "bg-white" : "bg-accent")} />
                  )}
                  {puntos(f).ping && (
                    <span className={"size-1 rounded-full " + (f === hoy ? "bg-white/70" : "bg-amber")} />
                  )}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-3">
            {t("monthHint")}
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

      </div>
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
  const t = useTranslations("calendar");
  const tSpace = useTranslations("space");
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
                {t("siesta")}
              </div>
            )}
            <div className={"flex gap-3 px-3 py-2.5 " + (idx < HORAS.length - 1 ? "border-b border-line" : "")}>
              <span className="w-11 pt-0.5 font-mono text-xs text-ink-3">{String(h).padStart(2, "0")}:00</span>
              <div className="flex-1">
                {m ? (
                  <div className="rounded-md border-l-[3px] border-ink-3 bg-surface-2 px-2.5 py-1.5 text-xs text-ink-2">
                    {t("maintenance")}
                    {m.motivo ? ` · ${m.motivo}` : ""}
                  </div>
                ) : r ? (
                  <div
                    className={
                      "rounded-md border-l-[3px] px-2.5 py-1.5 text-xs " +
                      (r.modo === "ping_pong" ? "border-amber bg-amber-soft" : "border-accent bg-accent-soft")
                    }
                  >
                    <span className="font-semibold">
                      {tSpace(r.modo === "ping_pong" ? "ping_pong" : "sala")}
                      {r.vivienda_id === miVivienda ? ` · ${t("you")}` : ""}
                    </span>
                  </div>
                ) : reservable ? (
                  <Link
                    href={`/reservar?fecha=${fecha}&hi=${h}`}
                    className="flex items-center justify-between rounded-md border border-dashed border-line-strong px-2.5 py-1.5 text-xs text-ink-2"
                  >
                    {t("free")}
                    <span className="font-semibold text-accent-ink">{t("book")} →</span>
                  </Link>
                ) : (
                  <div className="rounded-md border border-dashed border-line-strong px-2.5 py-1.5 text-xs text-ink-3">
                    {t("free")}
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
