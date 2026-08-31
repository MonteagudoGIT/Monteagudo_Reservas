"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  type Modo,
  diasReservables,
  franjasDe,
  formatoEuros,
  horarioValido,
  hoyMadridISO,
  nombreDiaCorto,
  nombreDiaLargo,
} from "@/lib/reservas";
import { crearReservaAction, horasOcupadas, type CrearState } from "./actions";
import { SubmitButton, Alert } from "@/components/ui";

type Precios = { sala: number; ping_pong: number };
const MODO_LABEL: Record<Modo, string> = { sala: "Sala", ping_pong: "Ping Pong" };
const HORAS = [10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 22];

export default function ReservarWizard({
  precios,
  saldoCent,
  vivienda,
  nombre,
  fechaInicial,
  hiInicial,
}: {
  precios: Precios;
  saldoCent: number;
  vivienda: string;
  nombre: string;
  fechaInicial?: string;
  hiInicial?: number;
}) {
  const dias = useMemo(() => diasReservables(), []);
  const [paso, setPaso] = useState(1);
  const [modo, setModo] = useState<Modo | null>(null);
  const [fecha, setFecha] = useState<string>(fechaInicial ?? hoyMadridISO());
  const [hi, setHi] = useState<number | null>(null);
  const [dur, setDur] = useState(1);
  const [porHoras, setPorHoras] = useState(false);
  const [ocupadas, setOcupadas] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);

  const [state, formAction] = useActionState<CrearState, FormData>(crearReservaAction, {});

  useEffect(() => {
    setCargando(true);
    setHi(null);
    setDur(1);
    horasOcupadas(fecha)
      .then(setOcupadas)
      .finally(() => setCargando(false));
  }, [fecha]);

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

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden">
      {/* ---- Cabecera de pasos (fija) ---- */}
      <div className="shrink-0 px-5 pt-5">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => (paso > 1 ? setPaso(paso - 1) : history.back())}
            className="flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface"
            aria-label="Atrás"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3">Reservar</div>
            <div className="font-semibold">
              Paso {paso} de 3 · {["Espacio", "Día y hora", "Pago"][paso - 1]}
            </div>
          </div>
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
          <p className="text-sm text-ink-2">Es la misma sala. Elige el uso.</p>
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
                <div className="font-semibold">{MODO_LABEL[m]}</div>
                <div className="text-xs text-ink-2">
                  {m === "sala"
                    ? "Por franjas o por horas, hasta el día completo."
                    : "Máximo 2 h. Aviso de revisión al terminar."}
                </div>
              </div>
              <span className="font-mono font-medium">{formatoEuros(precios[m])}</span>
            </button>
          ))}
          <Link href="/" className="mt-auto pt-4 text-center text-xs font-semibold text-accent-ink">
            Cancelar
          </Link>
        </div>
      )}

      {/* ---- PASO 2 · Día y hora ---- */}
      {paso === 2 && modo && (
        <>
          {/* Tira de días (fija) */}
          <div className="shrink-0 border-b border-line bg-ground px-5 pb-2 pt-2">
            <div className="flex gap-2 overflow-x-auto">
              {dias.map(({ iso }, i) => {
                const { dow, dia } = nombreDiaCorto(iso);
                const sel = iso === fecha;
                return (
                  <button
                    key={iso}
                    onClick={() => setFecha(iso)}
                    className={
                      "flex min-w-11 flex-col items-center gap-0.5 rounded-xl border px-1.5 py-2 " +
                      (sel ? "border-2 border-accent bg-accent-soft" : "border-line bg-surface")
                    }
                  >
                    <span className="text-[10px] capitalize text-ink-3">{i === 0 ? "hoy" : dow}</span>
                    <span className="text-sm font-semibold">{dia}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[.06em] text-ink-3">
              <span className="capitalize">{nombreDiaLargo(fecha)}</span>
            </div>
          </div>

          {/* Zona con scroll */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {modo === "sala" && (
              <div className="flex gap-2">
                {franjasDe("sala").map((f) => {
                  const ok = rangoLibre(f.inicio, f.fin - f.inicio);
                  const label = f.clave === "manana" ? "Mañana" : f.clave === "tarde" ? "Tarde" : "Día completo";
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
                        "flex-1 rounded-xl border px-2 py-2 text-center text-[13px] font-semibold " +
                        (hi === f.inicio && f.fin - f.inicio === dur && !porHoras
                          ? "border-2 border-accent bg-accent-soft"
                          : ok
                            ? "border-line bg-surface"
                            : "border-line bg-surface-2 text-ink-3")
                      }
                    >
                      {label}
                      <br />
                      <span className="text-[11px] font-normal">{ok ? `${f.inicio}–${f.fin}` : "ocupada"}</span>
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
                        Cerrado · siesta 15:00 – 17:00
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
                          <span className="text-ink-3">Reservado</span>
                        ) : sel ? (
                          <span className="font-semibold text-accent-ink">Seleccionado</span>
                        ) : (
                          <span className="text-ink-2">Libre</span>
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
                  <span className="text-sm text-ink-2">Duración</span>
                  <div className="flex items-center gap-2">
                    <StepBtn onClick={() => setDur(Math.max(1, dur - 1))} disabled={dur <= 1}>−</StepBtn>
                    <span className="w-10 text-center font-semibold">{dur} h</span>
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
                ? `Revisar · ${String(hi).padStart(2, "0")}:00–${String(hf).padStart(2, "0")}:00`
                : "Elige un hueco libre"}
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
              <Row k="Espacio" v={MODO_LABEL[modo]} />
              <Row k="Día" v={nombreDiaLargo(fecha)} cap />
              <Row k="Horario" v={`${String(hi).padStart(2, "0")}:00 – ${String(hf).padStart(2, "0")}:00`} />
              <Row k="Vivienda" v={`${vivienda} · ${nombre}`} />
              <div className="my-3 border-t border-line" />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-mono text-lg font-semibold">{formatoEuros(precio)}</span>
              </div>
            </div>

            {state.error ? <Alert>{state.error}</Alert> : null}

            <div className="text-[11px] font-semibold uppercase tracking-[.06em] text-ink-3">Cómo pagas</div>
            <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
              <input type="radio" name="metodo" value="transferencia" defaultChecked className="mt-1 size-4" style={{ accentColor: "var(--accent)" }} />
              <span className="text-sm">
                <span className="font-semibold">Transferencia</span>
                <span className="block text-xs text-ink-2">
                  La reserva queda retenida hasta que el administrador confirme el ingreso (máx. 3 días).
                </span>
              </span>
            </label>
            <label className={"flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 " + (saldoAlcanza ? "" : "opacity-60")}>
              <input type="radio" name="metodo" value="saldo" disabled={!saldoAlcanza} className="mt-1 size-4" style={{ accentColor: "var(--accent)" }} />
              <span className="text-sm">
                <span className="font-semibold">Saldo de la vivienda</span>
                <span className="block text-xs text-ink-2">
                  Disponible: {formatoEuros(saldoCent)}. {saldoAlcanza ? "Se confirma al instante." : "Insuficiente."}
                </span>
              </span>
            </label>
          </div>

          <div className="shrink-0 border-t border-line bg-ground px-5 pb-4 pt-3">
            <SubmitButton className="w-full">Confirmar · {formatoEuros(precio)}</SubmitButton>
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
