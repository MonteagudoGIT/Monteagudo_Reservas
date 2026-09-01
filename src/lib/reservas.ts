export const MODOS = ["sala", "ping_pong"] as const;
export type Modo = (typeof MODOS)[number];

export const TZ = "Europe/Madrid";
export const HORIZONTE_DIAS = 7;
/** Tope duro para la vista de calendario (cubre el mayor plazo configurable razonable). */
export const HORIZONTE_MAX = 60;

/** Bandas de apertura: [horaInicio, horaFinExclusiva]. Siesta 15–17 cerrada. */
export const BANDAS: ReadonlyArray<readonly [number, number]> = [
  [10, 15],
  [17, 23],
];

export type Franja = {
  clave: "manana" | "tarde" | "dia_completo";
  inicio: number;
  fin: number;
};

export const FRANJAS: Franja[] = [
  { clave: "manana", inicio: 10, fin: 15 },
  { clave: "tarde", inicio: 17, fin: 23 },
  { clave: "dia_completo", inicio: 10, fin: 23 },
];

export function franjasDe(modo: Modo): Franja[] {
  return modo === "ping_pong"
    ? FRANJAS.filter((f) => f.clave !== "dia_completo")
    : FRANJAS;
}

/** Horas de inicio de un tramo de 1 h (10,11,12,13,14,17,18,19,20,21,22). */
export function horasInicio(): number[] {
  const hs: number[] = [];
  for (const [ini, fin] of BANDAS) for (let h = ini; h < fin; h++) hs.push(h);
  return hs;
}

export function horarioValido(modo: Modo, hi: number, hf: number): boolean {
  if (hf <= hi) return false;
  const enBanda = (hi >= 10 && hf <= 15) || (hi >= 17 && hf <= 23);
  const diaCompleto = modo === "sala" && hi === 10 && hf === 23;
  if (!enBanda && !diaCompleto) return false;
  if (modo === "ping_pong" && hf - hi > 2) return false;
  return true;
}

/** "Nombre A." a partir de nombre y apellidos. */
export function nombreCorto(nombre?: string | null, apellidos?: string | null): string {
  const n = (nombre ?? "").trim();
  const a = (apellidos ?? "").trim();
  if (!n && !a) return "";
  return a ? `${n} ${a[0]}.` : n;
}

export function formatoEuros(cent: number): string {
  return (cent / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

export function euroACent(txt: string): number | null {
  const n = Number(txt.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function isoEnMadrid(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

export function hoyMadridISO(): string {
  return isoEnMadrid(new Date());
}

/** Días reservables: hoy + `dias` (por defecto 7). */
export function diasReservables(dias = HORIZONTE_DIAS): { iso: string; date: Date }[] {
  const base = new Date(hoyMadridISO() + "T12:00:00Z");
  const out: { iso: string; date: Date }[] = [];
  for (let i = 0; i <= dias; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    out.push({ iso: isoEnMadrid(d), date: d });
  }
  return out;
}

/** Suma `n` días a una fecha ISO (yyyy-mm-dd), devuelve ISO. */
export function sumarDias(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Primer día (ISO) del mes que contiene `iso`. */
export function primerDiaMes(iso: string): string {
  return iso.slice(0, 8) + "01";
}

/** Suma `n` meses al mes de `iso`, devuelve el día 1 del mes resultante. */
export function sumarMeses(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1, 12))
    .toISOString()
    .slice(0, 10);
}

/**
 * Rejilla de un mes (6 filas × 7 = 42 celdas), empezando en lunes.
 * `iso` es cualquier día del mes objetivo.
 */
export function celdasDeMes(iso: string): { iso: string; otroMes: boolean }[] {
  const d = new Date(primerDiaMes(iso) + "T12:00:00Z");
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const offset = (new Date(Date.UTC(y, m, 1, 12)).getUTCDay() + 6) % 7; // 0 = lunes
  const inicio = new Date(Date.UTC(y, m, 1 - offset, 12));
  const out: { iso: string; otroMes: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const c = new Date(inicio);
    c.setUTCDate(inicio.getUTCDate() + i);
    const ci = c.toISOString().slice(0, 10);
    out.push({ iso: ci, otroMes: c.getUTCMonth() !== m });
  }
  return out;
}

/** Hora (0–23) en Madrid de un timestamp ISO. */
export function horaMadrid(iso: string): number {
  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return parseInt(s, 10) % 24;
}

export function nombreDiaLargo(iso: string, loc = "es-ES"): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString(loc, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function nombreDiaCorto(
  iso: string,
  loc = "es-ES",
): { dow: string; dia: string } {
  const d = new Date(iso + "T12:00:00Z");
  return {
    dow: d.toLocaleDateString(loc, { weekday: "short", timeZone: "UTC" }),
    dia: d.toLocaleDateString(loc, { day: "numeric", timeZone: "UTC" }),
  };
}
