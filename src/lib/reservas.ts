export const MODOS = ["sala", "ping_pong"] as const;
export type Modo = (typeof MODOS)[number];

export const TZ = "Europe/Madrid";
export const HORIZONTE_DIAS = 7;

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

/** Días reservables: hoy + 7. */
export function diasReservables(): { iso: string; date: Date }[] {
  const base = new Date(hoyMadridISO() + "T12:00:00Z");
  const out: { iso: string; date: Date }[] = [];
  for (let i = 0; i <= HORIZONTE_DIAS; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    out.push({ iso: isoEnMadrid(d), date: d });
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

export function nombreDiaLargo(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function nombreDiaCorto(iso: string): { dow: string; dia: string } {
  const d = new Date(iso + "T12:00:00Z");
  return {
    dow: d.toLocaleDateString("es-ES", { weekday: "short", timeZone: "UTC" }),
    dia: d.toLocaleDateString("es-ES", { day: "numeric", timeZone: "UTC" }),
  };
}
