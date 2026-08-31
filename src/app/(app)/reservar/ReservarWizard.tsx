"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  type Modo,
  diasReservables,
  franjasDe,
  formatoEuros,
  horarioValido,
  nombreDiaCorto,
  nombreDiaLargo,
} from "@/lib/reservas";
import { crearReservaAction, horasOcupadas, type CrearState } from "./actions";
import { SubmitButton, Alert } from "@/components/ui";

type Precios = { sala: number; ping_pong: number };
const MODO_LABEL: Record<Modo, string> = { sala: "Sala", ping_pong: "Ping Pong" };

const HORAS_MANANA = [10, 11, 12, 13, 14];
const HORAS_TARDE = [17, 18, 19, 20, 21, 22];

export default function ReservarWizard({
  precios,
  saldoCent,
  vivienda,
  nombre,
}: {
  precios: Precios;
  saldoCent: number;
  vivienda: string;
  nombre: string;
}) {
  const [paso, setPaso] = useState(1);
  const [modo, setModo] = useState<Modo | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [hi, setHi] = useState<number | null>(null);
  const [dur, setDur] = useState(1);
  const [porHoras, setPorHoras] = useState(false);
  const [ocupadas, setOcupadas] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);

  const dias = useMemo(() => diasReservables(), []);
  const [state, formAction] = useActionState<CrearState, FormData>(crearReservaAction, {});

  useEffect(() => {
    if (!fecha) return;
    setCargando(true);
    horasOcupadas(fecha)
      .then(setOcupadas)
      .finally(() => setCargando(false));
    setHi(null);
    setDur(1);
  }, [fecha]);

  const precio = modo ? precios[modo] : 0;
  const maxDur = modo === "ping_pong" ? 2 : 13;
  const hf = hi != null ? hi + dur : null;

  function bandaDe(h: number) {
    return h < 15 ? HORAS_MANANA : HORAS_TARDE;
  }
  function libre(h: number) {
    return !ocupadas.includes(h);
  }
  function rangoLibre(inicio: number, d: number) {
    for (let h = inicio; h < inicio + d; h++) if (ocupadas.includes(h)) return false;
    return true;
  }
  function durMaxDesde(inicio: number) {
    const banda = bandaDe(inicio);
    const finBanda = banda[banda.length - 1] + 1;
    let d = 1;
    while (
      d < maxDur &&
      inicio + d < finBanda &&
      rangoLibre(inicio, d + 1)
    )
      d++;
    return d;
  }

  const seleccionOk =
    modo != null && fecha != null && hi != null && hf != null && horarioValido(modo, hi, hf) && rangoLibre(hi, dur);

  const saldoAlcanza = saldoCent >= precio;

  // ---------- Cabecera de pasos ----------
  const header = (
    <div className="px-5 pt-5">
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
            Paso {paso} de 4 · {["Espacio", "Día", "Horas", "Pago"][paso - 1]}
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={"h-1 flex-1 rounded-full " + (n <= paso ? "bg-accent" : "bg-line-strong")}
          />
        ))}
      </div>
    </div>
  );

  return (
    <main className="flex min-h-dvh flex-col">
      {header}

      <div className="flex-1 px-5 py-5">
        {/* PASO 1 · Espacio */}
        {paso === 1 && (
          <div className="flex flex-col gap-3">
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
          </div>
        )}

        {/* PASO 2 · Día */}
        {paso === 2 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-2">Hasta 7 días vista.</p>
            {dias.map(({ iso }, i) => {
              const { dow, dia } = nombreDiaCorto(iso);
              return (
                <button
                  key={iso}
                  onClick={() => {
                    setFecha(iso);
                    setPaso(3);
                  }}
                  className={
                    "flex items-center justify-between rounded-xl border bg-surface px-4 py-3.5 text-left " +
                    (fecha === iso ? "border-2 border-accent" : "border-line")
                  }
                >
                  <span className="font-semibold capitalize">
                    {i === 0 ? "Hoy · " : ""}
                    {dow} {dia}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* PASO 3 · Horas */}
        {paso === 3 && modo && fecha && (
          <div className="flex flex-col gap-4">
            <div className="text-[11px] font-semibold uppercase tracking-[.06em] text-ink-3">
              {MODO_LABEL[modo]} · <span className="capitalize">{nombreDiaLargo(fecha)}</span>
            </div>

            {modo === "sala" && (
              <div className="flex gap-2">
                {franjasDe("sala").map((f) => {
                  const ok = rangoLibre(f.inicio, f.fin - f.inicio);
                  const label =
                    f.clave === "manana" ? "Mañana" : f.clave === "tarde" ? "Tarde" : "Día completo";
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
                        "flex-1 rounded-xl border px-2 py-2.5 text-center text-[13px] font-semibold " +
                        (hi === f.inicio && f.fin - f.inicio === dur
                          ? "border-2 border-accent bg-accent-soft"
                          : ok
                            ? "border-line bg-surface"
                            : "border-line bg-surface-2 text-ink-3")
                      }
                    >
                      {label}
                      <br />
                      <span className="text-[11px] font-normal">
                        {ok ? `${f.inicio}–${f.fin}` : "ocupada"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="text-[11px] font-semibold uppercase tracking-[.06em] text-ink-3">
              {modo === "sala" ? "O por horas" : "Elige la hora"}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[...HORAS_MANANA, ...HORAS_TARDE].map((h) => {
                const sel = hi === h;
                const dispon = libre(h) && durMaxDesde(h) >= 1;
                return (
                  <button
                    key={h}
                    disabled={!dispon || cargando}
                    onClick={() => {
                      setHi(h);
                      setDur(1);
                      setPorHoras(true);
                    }}
                    className={
                      "rounded-lg py-2.5 text-center font-mono text-[13px] " +
                      (sel
                        ? "bg-accent font-semibold text-white"
                        : dispon
                          ? "border border-line-strong bg-surface"
                          : "bg-surface-2 text-ink-3")
                    }
                  >
                    {String(h).padStart(2, "0")}:00
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-ink-3">Cerrado de 15:00 a 17:00 (siesta).</p>

            {hi != null && porHoras && (
              <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink-2">Duración</span>
                  <div className="flex items-center gap-2">
                    <StepBtn onClick={() => setDur(Math.max(1, dur - 1))} disabled={dur <= 1}>
                      −
                    </StepBtn>
                    <span className="w-10 text-center font-semibold">{dur} h</span>
                    <StepBtn
                      onClick={() => setDur(Math.min(durMaxDesde(hi), dur + 1))}
                      disabled={dur >= durMaxDesde(hi)}
                    >
                      +
                    </StepBtn>
                  </div>
                </div>
                <span className="font-mono text-sm">
                  {String(hi).padStart(2, "0")}:00–{String(hi + dur).padStart(2, "0")}:00
                </span>
              </div>
            )}

            {hi != null && !porHoras && hf != null && (
              <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm">
                <span className="text-ink-2">Seleccionado</span>
                <span className="font-mono font-semibold">
                  {String(hi).padStart(2, "0")}:00–{String(hf).padStart(2, "0")}:00
                </span>
              </div>
            )}

            <button
              disabled={!seleccionOk}
              onClick={() => setPaso(4)}
              className="mt-2 flex h-12 items-center justify-center rounded-xl bg-accent font-semibold text-white disabled:opacity-50"
            >
              Revisar la reserva
            </button>
          </div>
        )}

        {/* PASO 4 · Pago */}
        {paso === 4 && modo && fecha && hi != null && hf != null && (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="modo" value={modo} />
            <input type="hidden" name="fecha" value={fecha} />
            <input type="hidden" name="hi" value={hi} />
            <input type="hidden" name="hf" value={hf} />

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

            <div className="text-[11px] font-semibold uppercase tracking-[.06em] text-ink-3">
              Cómo pagas
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
              <input type="radio" name="metodo" value="transferencia" defaultChecked className="mt-1 size-4" style={{ accentColor: "var(--accent)" }} />
              <span className="text-sm">
                <span className="font-semibold">Transferencia</span>
                <span className="block text-xs text-ink-2">
                  La reserva queda retenida hasta que el administrador confirme el ingreso (máx. 3 días).
                </span>
              </span>
            </label>
            <label
              className={
                "flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 " +
                (saldoAlcanza ? "" : "opacity-60")
              }
            >
              <input
                type="radio"
                name="metodo"
                value="saldo"
                disabled={!saldoAlcanza}
                className="mt-1 size-4"
                style={{ accentColor: "var(--accent)" }}
              />
              <span className="text-sm">
                <span className="font-semibold">Saldo de la vivienda</span>
                <span className="block text-xs text-ink-2">
                  Disponible: {formatoEuros(saldoCent)}. {saldoAlcanza ? "Se confirma al instante." : "Insuficiente."}
                </span>
              </span>
            </label>

            <SubmitButton className="mt-2">Confirmar reserva · {formatoEuros(precio)}</SubmitButton>
            <p className="text-center text-xs text-ink-3">
              Al confirmar aceptas las normas de uso del espacio.
            </p>
          </form>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-line bg-ground px-5 py-3 text-center text-xs text-ink-3">
        <Link href="/" className="font-semibold text-accent-ink">
          Cancelar
        </Link>
      </div>
    </main>
  );
}

function StepBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
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
