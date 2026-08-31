import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { formatoEuros } from "@/lib/reservas";

const MODO_LABEL: Record<string, string> = { sala: "Sala", ping_pong: "Ping Pong" };
const ESTADO_LABEL: Record<string, string> = {
  retenida: "Pendiente de pago",
  confirmada: "Confirmada",
  pendiente_aprobacion: "Pendiente de aprobación",
};

function rango(inicio: string, fin: string) {
  const opt: Intl.DateTimeFormatOptions = { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" };
  return `${new Date(inicio).toLocaleTimeString("es-ES", opt)} – ${new Date(fin).toLocaleTimeString("es-ES", opt)}`;
}
function fechaLarga(inicio: string) {
  return new Date(inicio).toLocaleDateString("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function Home() {
  const session = await getSessionUser();
  const supabase = await createClient();
  const perfil = session!.perfil!;

  const [{ data: proxima }, { data: saldo }] = await Promise.all([
    supabase
      .from("reservas")
      .select("id, modo, inicio, fin, estado")
      .eq("vivienda_id", perfil.vivienda_id!)
      .in("estado", ["retenida", "confirmada", "pendiente_aprobacion"])
      .gte("inicio", new Date().toISOString())
      .order("inicio", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.rpc("saldo_vivienda", { p_vivienda: perfil.vivienda_id }),
  ]);

  return (
    <main className="flex flex-col gap-5 px-5 pb-6 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" aria-hidden>
            <path d="M5 21V10a7 7 0 0 1 14 0v11" />
            <path d="M3 21h18" />
          </svg>
          <span className="font-semibold tracking-tight">Monteagudo</span>
        </div>
        <LanguageSwitcher />
      </div>

      <div>
        <h1 className="text-2xl font-semibold">
          Hola, {perfil.nombre?.trim() || session!.user.email}
        </h1>
        {session!.perfil?.rol === "admin" && (
          <Link
            href="/admin"
            className="mt-1 inline-block rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-ink"
          >
            Ir a administración →
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <span className="text-[11px] font-semibold uppercase tracking-[.09em] text-ink-3">
          Próxima reserva
        </span>
        {proxima ? (
          <Link href={`/reserva/${proxima.id}`} className="mt-2 block">
            <div className="text-lg font-semibold">{MODO_LABEL[proxima.modo]}</div>
            <div className="text-sm text-ink-2">
              {fechaLarga(proxima.inicio)} · {rango(proxima.inicio, proxima.fin)}
            </div>
            <div className="mt-2 text-xs font-semibold text-accent-ink">
              {ESTADO_LABEL[proxima.estado] ?? proxima.estado}
            </div>
          </Link>
        ) : (
          <p className="mt-2 text-sm text-ink-2">No tienes reservas próximas.</p>
        )}
      </div>

      <Link
        href="/reservar"
        className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Reservar
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/calendario" className="rounded-2xl border border-line bg-surface p-4">
          <div className="text-sm font-semibold">Calendario</div>
          <div className="text-xs text-ink-3">Ver disponibilidad</div>
        </Link>
        <Link href="/mis-reservas" className="rounded-2xl border border-line bg-surface p-4">
          <div className="text-sm font-semibold">Mis reservas</div>
          <div className="text-xs text-ink-3">Próximas e historial</div>
        </Link>
      </div>

      <Link
        href="/perfil"
        className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5"
      >
        <span className="text-sm">Saldo de la vivienda</span>
        <span className="font-mono font-medium">{formatoEuros(Number(saldo ?? 0))}</span>
      </Link>
    </main>
  );
}
