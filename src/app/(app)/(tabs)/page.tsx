import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { formatoEuros, nombreCorto } from "@/lib/reservas";

const MODO_LABEL: Record<string, string> = { sala: "Sala", ping_pong: "Ping Pong" };

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
  const t = await getTranslations("home");

  const [{ data: proximas }, { data: saldo }, { data: avisos }, { data: vivienda }, { data: convivientes }] =
    await Promise.all([
      supabase
        .from("reservas")
        .select("id, modo, inicio, fin, estado, aprobacion, usuario_id")
        .eq("vivienda_id", perfil.vivienda_id!)
        .in("estado", ["retenida", "confirmada"])
        .gte("inicio", new Date().toISOString())
        .order("inicio", { ascending: true })
        .limit(5),
      supabase.rpc("saldo_vivienda", { p_vivienda: perfil.vivienda_id }),
      supabase
        .from("avisos")
        .select("id, titulo, cuerpo, publicado_en")
        .eq("publicado", true)
        .order("publicado_en", { ascending: false })
        .limit(2),
      supabase.from("viviendas").select("etiqueta").eq("id", perfil.vivienda_id!).maybeSingle(),
      supabase.from("perfiles").select("id, nombre, apellidos").eq("vivienda_id", perfil.vivienda_id!),
    ]);

  const reservas = proximas ?? [];
  const piso = vivienda?.etiqueta ?? "";
  const nombres: Record<string, string> = {};
  for (const p of convivientes ?? []) nombres[p.id] = nombreCorto(p.nombre, p.apellidos);
  const quien = (uid: string | null) =>
    [piso, uid ? nombres[uid] : ""].filter(Boolean).join(" · ");

  return (
    <main className="flex h-full flex-col">
      <header className="shrink-0 px-5 pb-3 pt-6">
        <div className="flex items-center justify-between gap-3">
          <Image
            src="/monteagudo-wordmark.png"
            alt="Monteagudo"
            width={160}
            height={19}
            className="h-5 w-auto"
          />
          <LanguageSwitcher />
        </div>
        <h1 className="mt-3 text-2xl font-semibold">
          {t("greeting", { name: perfil.nombre?.trim() || session!.user.email || "" })}
        </h1>
        {session!.perfil?.rol === "admin" && (
          <Link
            href="/admin"
            className="mt-1 inline-block rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-ink"
          >
            {t("goToAdmin")}
          </Link>
        )}
      </header>

      {/* Bloques siempre visibles */}
      <div className="shrink-0 space-y-3 px-5 pb-3 pt-1">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/calendario" className="rounded-2xl border border-line bg-surface p-4">
            <div className="text-sm font-semibold">{t("calendarTitle")}</div>
            <div className="text-xs text-ink-3">{t("calendarHint")}</div>
          </Link>
          <Link href="/mis-reservas" className="rounded-2xl border border-line bg-surface p-4">
            <div className="text-sm font-semibold">{t("myBookingsTitle")}</div>
            <div className="text-xs text-ink-3">{t("myBookingsHint")}</div>
          </Link>
        </div>
        <Link
          href="/perfil"
          className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5"
        >
          <span className="text-sm">{t("balance")}</span>
          <span className="font-mono font-medium">{formatoEuros(Number(saldo ?? 0))}</span>
        </Link>
      </div>

      {/* Zona con scroll: próximas reservas y avisos */}
      <div className="scroll-area min-h-0 flex-1 space-y-4 px-5 pb-6 pt-1">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[.09em] text-ink-3">
            {t("nextBooking")}
          </span>
          {reservas.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-sm text-ink-2">{t("noNextBooking")}</p>
            </div>
          ) : (
            reservas.map((r) => (
              <Link
                key={r.id}
                href={`/reserva/${r.id}`}
                className="block rounded-2xl border border-line bg-surface p-4"
              >
                <div className="text-lg font-semibold">{MODO_LABEL[r.modo]}</div>
                <div className="text-sm text-ink-2">
                  {fechaLarga(r.inicio)} · {rango(r.inicio, r.fin)}
                </div>
                {quien(r.usuario_id) ? (
                  <div className="mt-0.5 text-xs text-ink-3">{quien(r.usuario_id)}</div>
                ) : null}
                <div className="mt-2 text-xs font-semibold text-accent-ink">
                  {r.aprobacion === "pendiente"
                    ? t("st_pendiente_aprobacion")
                    : t(`st_${r.estado}` as "st_confirmada")}
                </div>
              </Link>
            ))
          )}
        </div>

        {(avisos ?? []).length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[.09em] text-ink-3">Avisos</span>
              <Link href="/avisos" className="text-xs font-semibold text-accent-ink">Ver todos</Link>
            </div>
            {avisos!.map((a) => (
              <Link key={a.id} href="/avisos" className="block rounded-2xl border border-line bg-surface p-4">
                <div className="text-sm font-semibold">{a.titulo}</div>
                <div className="mt-0.5 line-clamp-2 text-xs text-ink-2">{a.cuerpo}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
