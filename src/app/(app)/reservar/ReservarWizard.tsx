"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  type Modo,
  celdasDeMes,
  franjasDe,
  formatoEuros,
  horarioValido,
  hoyMadridISO,
  nombreDiaLargo,
  primerDiaMes,
  sumarDias,
  sumarMeses,
} from "@/lib/reservas";
import { crearReservaAction, diasConReserva, horasOcupadas, type CrearState } from "./actions";
import { SubmitButton, Alert } from "@/components/ui";

type Precios = { sala: number; ping_pong: number };
type DiasAntelacion = { sala: number; ping_pong: number };
const HORAS = [10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 22];
const LOC: Record<string, string> = { es: "es-ES", en: "en-GB" };

export default function ReservarWizard({
  precios,
  diasAntelacion,
  saldoCent,
  vivienda,
  nombre,
  fechaInicial,
  hiInicial,
}: {
  precios: Precios;
  diasAntelacion: DiasAntelacion;
  saldoCent: number;
  vivienda: string;
  nombre: string;
  fechaInicial?: string;
  hiInicial?: number;
}) {
  const t = useTranslations("reservar");
  const tSpace = useTranslations("space");
  const loc = LOC[useLocale()] ?? "es-ES";

  const hoy = hoyMadridISO();
  const [paso, setPaso] = useState(1);
  const [modo, setModo] = useState<Modo | null>(null);
  const [fecha, setFecha] = useState<string>(fechaInicial ?? hoy);
  const [mesRef, setMesRef] = useState<string>(primerDiaMes(fechaInicial ?? hoy));
  const [diasReserva, setDiasReserva] = useState<string[]>([]);
  const [hi, setHi] = useState<number | null>(null);
  const [dur, setDur] = useState(1);
  const [porHoras, setPorHoras] = useState(false);
  const [ocupadas, setOcupadas] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);

  const [state, formAction] = useActionState<CrearState, FormData>(crearReservaAction, {});

  const limiteISO = sumarDias(hoy, modo ? diasAntelacion[modo] : 7);

  // Ocupación horaria del día elegido
  useEffect(() => {
    setCargando(true);
    setHi(null);
    setDur(1);
    horasOcupadas(fecha)
      .then(setOcupadas)
      .finally(() => setCargando(false));
  }, [fecha]);

  // Puntos del calendario: días con reserva en el mes visible
  useEffect(() => {
    const celdas = celdasDeMes(mesRef);
    diasConReserva(celdas[0].iso, celdas[41].iso).then(setDiasReserva);
  }, [mesRef]);

  // Al elegir espacio: encajar la fecha en el nuevo plazo y centrar el calendario
  useEffect(() => {
    if (!modo) return;
    const tope = sumarDias(hoy, diasAntelacion[modo]);
    if (fecha < hoy || fecha > tope) {
      setFecha(hoy);
      setMesRef(primerDiaMes(hoy));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo]);

  useEffect(() => {
    if (modo != null && hiInicial != null && !ocupadas.includes(hiInicial)) {
      setHi(hiInicial);
      setDur(1);
      setPorHoras(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, ocupadas]);

  const precio = modo ? precios[modo] : 0;
  const maxDur = modo === "ping_pong" ? 2 : 13;
  const hf = hi != null ? hi + dur : null;

  const bandaDe = (h: number) => (h < 15 ? [10, 14] : [17, 22]);
  const libre = (h: number) => !ocupadas.includes(h);
  const rangoLibre = (ini: number, d: number) => {
    for (let h = ini; h < ini + d; h++) if (ocupadas.includes(h)) return false;
    return true;
  };
  const durMax = (ini: number) => {
    const finBanda = bandaDe(ini)[1] + 1;
    let d = 1;
    while (d < maxDur && ini + d < finBanda && rangoLibre(ini, d + 1)) d++;
    return d;
  };

  const seleccionOk =
    modo != null && hi != null && hf != null && horarioValido(modo, hi, hf) && rangoLibre(hi, dur);
  const saldoAlcanza = saldoCent >= precio;
  const seleccionado = (h: number) => hi != null && hf != null && h >= hi && h < hf;

  // --- Calendario ---
  const DOW = useMemo(() => {
    const base = new Date(Date.UTC(2024, 0, 1)); // lunes
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setUTCDate(1 + i);
      return d.toLocaleDateString(loc, { weekday: "narrow", timeZone: "UTC" });
    });
  }, [loc]);
  const celdas = useMemo(() => celdasDeMes(mesRef), [mesRef]);
  const mesLargo = new Date(mesRef + "T12:00:00Z").toLocaleDateString(loc, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const puedePrev = primerDiaMes(mesRef) > primerDiaMes(hoy);
  const puedeNext = primerDiaMes(mesRef) < primerDiaMes(limiteISO);
  const fechaCorta = new Date(fecha + "T12:00:00Z").toLocaleDateString(loc, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <main className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden">
      {/* ---- Cabecera de pasos (fija) ---- */}
      <div className="shrink-0 px-5 pt-5">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => (paso > 1 ? setPaso(paso - 1) : history.back())}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface"
            aria-label="Atrás"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-[.08em] text-ink-3">{t("eyebrow")}</div>
            <div className="font-semibold">
              {t("step", { n: paso, name: t((["s1", "s2", "s3"] as const)[paso - 1]) })}
            </div>
          </div>
          {paso === 2 && (
            <div className="shrink-0 text-right">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[.06em] text-ink-3">
                {t("day")}
              </div>
              <div className="text-sm font-semibold capitalize">{fechaCorta}</div>
            </div>
          )}
        </div>
        <div className="mb-1 mt-3 flex gap-1.5">
          {[1, 2, 3].map((n) => (
            <span key={n} className={"h-1 flex-1 rounded-full " + (n <= paso ? "bg-accent" : "bg-line-strong")} />
          ))}
        </div>
      </div>

      {/* ---- PASO 1 · Espacio ---- */}
      {paso === 1 && (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
          <p className="text-sm text-ink-2">{t("chooseUse")}</p>
          {(["sala", "ping_pong"] as Modo[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setModo(m);
                setPaso(2);
              }}
              className={
                "flex items-center justify-between rounded-2xl border bg-surface p-4 text-left " +
                (modo === m ? "border-2 border-accent" : "border-line")
              }
            >
              <div>
                <div className="font-semibold">{tSpace(m)}</div>
                <div className="text-xs text-ink-2">
                  {m === "sala" ? t("salaHint") : t("pingHint")}
                </div>
              </div>
              <span className="font-mono font-medium">{formatoEuros(precios[m])}</span>
            </button>
          ))}

          <p className="rounded-xl border border-danger/40 bg-danger-soft px-3.5 py-2.5 text-xs leading-relaxed text-danger">
            {t("payReminder")}
          </p>

          <Link href="/" className="mt-auto pt-2 text-center text-xs font-semibold text-accent-ink">
            {t("cancel")}
          </Link>
        </div>
      )}

      {/* ---- PASO 2 · Día y hora ---- */}
      {paso === 2 && modo && (
        <>
          {/* Minicalendario (fijo, compacto) */}
          <div className="shrink-0 border-b border-line bg-ground px-5 pb-2 pt-1.5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setMesRef(sumarMeses(mesRef, -1))}
                disabled={!puedePrev}
                aria-label={t("prevMonth")}
                className="flex size-7 items-center justify-center rounded-lg text-ink-2 disabled:opacity-30"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <span className="text-[0.8rem] font-semibold first-letter:uppercase">{mesLargo}</span>
              <button
                onClick={() => setMesRef(sumarMeses(mesRef, 1))}
                disabled={!puedeNext}
                aria-label={t("nextMonth")}
                className="flex size-7 items-center justify-center rounded-lg text-ink-2 disabled:opacity-30"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-0.5 grid grid-cols-7 text-center text-[0.62rem] uppercase text-ink-3">
              {DOW.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="mt-0.5 grid grid-cols-7 gap-0.5">
              {celdas.map(({ iso, otroMes }) => {
                const fuera = iso < hoy || iso > limiteISO;
                const sel = iso === fecha;
                const conReserva = diasReserva.includes(iso);
                return (
                  <button
                    key={iso}
                    disabled={fuera}
                    onClick={() => {
                      setFecha(iso);
                      if (otroMes) setMesRef(primerDiaMes(iso));
                    }}
                    className={
                      "relative flex h-7 items-center justify-center rounded-md text-xs " +
                      (sel
                        ? "bg-accent font-bold text-white"
                        : fuera
                          ? "text-ink-3/40"
                          : otroMes
                            ? "text-ink-3 hover:bg-surface-2"
                            : "font-medium hover:bg-surface-2")
                    }
                  >
                    {Number(iso.slice(8, 10))}
                    {conReserva && !sel && (
                      <span className="absolute bottom-0.5 size-1 rounded-full bg-amber" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zona con scroll */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {modo === "sala" && (
              <div className="flex gap-2">
                {franjasDe("sala").map((f) => {
                  const ok = rangoLibre(f.inicio, f.fin - f.inicio);
                  const label =
                    f.clave === "manana" ? t("manana") : f.clave === "tarde" ? t("tarde") : t("diaCompleto");
                  const activa = hi === f.inicio && f.fin - f.inicio === dur && !porHoras;
                  return (
                    <button
                      key={f.clave}
                      disabled={!ok}
                      onClick={() => {
                        setHi(f.inicio);
                        setDur(f.fin - f.inicio);
                        setPorHoras(false);
                      }}
                      className={
                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold leading-none " +
                        (activa
                          ? "border-accent bg-accent-soft"
                          : ok
                            ? "border-line bg-surface"
                            : "border-line bg-surface-2 text-ink-3")
                      }
                    >
                      <span>{label}</span>
                      <span className="text-[0.62rem] font-normal text-ink-3">
                        {ok ? `${f.inicio}–${f.fin}` : t("busy")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {HORAS.map((h, idx) => {
                const ocupada = !libre(h);
                const sel = seleccionado(h);
                const puedeIniciar = libre(h) && durMax(h) >= 1;
                return (
                  <div key={h}>
                    {h === 17 && (
                      <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-xs text-ink-3 [background:repeating-linear-gradient(135deg,var(--surface),var(--surface)_7px,var(--surface-2)_7px,var(--surface-2)_14px)]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M8 12h8" />
                        </svg>
                        {t("siesta")}
                      </div>
                    )}
                    <button
                      disabled={ocupada || cargando || (!puedeIniciar && !sel)}
                      onClick={() => {
                        setHi(h);
                        setDur(1);
                        setPorHoras(true);
                      }}
                      className={
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left " +
                        (idx < HORAS.length - 1 ? "border-b border-line " : "") +
                        (sel ? "bg-accent-soft" : "")
                      }
                    >
                      <span className="w-11 font-mono text-xs text-ink-3">{String(h).padStart(2, "0")}:00</span>
                      <span className="flex-1 text-xs">
                        {ocupada ? (
                          <span className="text-ink-3">{t("reserved")}</span>
                        ) : sel ? (
                          <span className="font-semibold text-accent-ink">{t("selected")}</span>
                        ) : (
                          <span className="text-ink-2">{t("free")}</span>
                        )}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {hi != null && porHoras && (
              <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink-2">{t("duration")}</span>
                  <div className="flex items-center gap-2">
                    <StepBtn onClick={() => setDur(Math.max(1, dur - 1))} disabled={dur <= 1}>−</StepBtn>
                    <span className="w-12 text-center font-semibold">{t("hours", { n: dur })}</span>
                    <StepBtn onClick={() => setDur(Math.min(durMax(hi), dur + 1))} disabled={dur >= durMax(hi)}>+</StepBtn>
                  </div>
                </div>
                <span className="font-mono text-sm">
                  {String(hi).padStart(2, "0")}:00–{String(hi + dur).padStart(2, "0")}:00
                </span>
              </div>
            )}
          </div>

          {/* Acción fija abajo */}
          <div className="shrink-0 border-t border-line bg-ground px-5 pb-4 pt-3">
            <button
              disabled={!seleccionOk}
              onClick={() => setPaso(3)}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-accent font-semibold text-white disabled:opacity-50"
            >
              {seleccionOk && hi != null && hf != null
                ? t("review", {
                    range: `${String(hi).padStart(2, "0")}:00–${String(hf).padStart(2, "0")}:00`,
                  })
                : t("pickSlot")}
            </button>
          </div>
        </>
      )}

      {/* ---- PASO 3 · Pago ---- */}
      {paso === 3 && modo && hi != null && hf != null && (
        <form action={formAction} className="flex flex-1 flex-col overflow-hidden">
          <input type="hidden" name="modo" value={modo} />
          <input type="hidden" name="fecha" value={fecha} />
          <input type="hidden" name="hi" value={hi} />
          <input type="hidden" name="hf" value={hf} />

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
              <Row k={t("space")} v={tSpace(modo)} />
              <Row k={t("day")} v={nombreDiaLargo(fecha, loc)} cap />
              <Row k={t("time")} v={`${String(hi).padStart(2, "0")}:00 – ${String(hf).padStart(2, "0")}:00`} />
              <Row k={t("home")} v={`${vivienda} · ${nombre}`} />
              <div className="my-3 border-t border-line" />
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t("total")}</span>
                <span className="font-mono text-lg font-semibold">{formatoEuros(precio)}</span>
              </div>
            </div>

            {state.error ? <Alert>{state.error}</Alert> : null}

            <div className="text-xs font-semibold uppercase tracking-[.06em] text-ink-3">{t("howToPay")}</div>
            <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
              <input type="radio" name="metodo" value="transferencia" defaultChecked className="mt-1 size-4" style={{ accentColor: "var(--accent)" }} />
              <span className="text-sm">
                <span className="font-semibold">{t("transfer")}</span>
                <span className="block text-xs text-ink-2">{t("transferHint")}</span>
              </span>
            </label>
            <label className={"flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 " + (saldoAlcanza ? "" : "opacity-60")}>
              <input type="radio" name="metodo" value="saldo" disabled={!saldoAlcanza} className="mt-1 size-4" style={{ accentColor: "var(--accent)" }} />
              <span className="text-sm">
                <span className="font-semibold">{t("balance")}</span>
                <span className="block text-xs text-ink-2">
                  {saldoAlcanza
                    ? t("balanceEnough", { amount: formatoEuros(saldoCent) })
                    : t("balanceShort", { amount: formatoEuros(saldoCent) })}
                </span>
              </span>
            </label>
          </div>

          <div className="shrink-0 border-t border-line bg-ground px-5 pb-4 pt-3">
            <SubmitButton className="w-full">{t("confirm", { amount: formatoEuros(precio) })}</SubmitButton>
          </div>
        </form>
      )}
    </main>
  );
}

function StepBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex size-8 items-center justify-center rounded-lg border border-line-strong bg-surface text-lg leading-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Row({ k, v, cap }: { k: string; v: string; cap?: boolean }) {
  return (
    <div className="mt-2 flex justify-between first:mt-0">
      <span className="text-ink-2">{k}</span>
      <span className={"font-semibold " + (cap ? "capitalize" : "")}>{v}</span>
    </div>
  );
}
