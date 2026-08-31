import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/app/(app)/actions";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { formatoEuros } from "@/lib/reservas";

export default async function Page() {
  const session = await getSessionUser();
  const perfil = session!.perfil!;
  const supabase = await createClient();
  const t = await getTranslations("profile");

  const [{ data: vivienda }, { data: saldo }, { data: movimientos }] = await Promise.all([
    supabase.from("viviendas").select("etiqueta").eq("id", perfil.vivienda_id!).single(),
    supabase.rpc("saldo_vivienda", { p_vivienda: perfil.vivienda_id }),
    supabase
      .from("saldo_movimientos")
      .select("tipo, importe_cent, motivo, creado_en")
      .eq("vivienda_id", perfil.vivienda_id!)
      .order("creado_en", { ascending: false })
      .limit(8),
  ]);

  return (
    <main className="flex flex-col gap-5 px-5 pb-6 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <LanguageSwitcher />
      </div>

      <div className="flex items-center gap-3.5">
        <span className="flex size-13 items-center justify-center rounded-full bg-accent-soft text-lg font-semibold text-accent-ink">
          {(perfil.nombre?.[0] ?? "") + (perfil.apellidos?.[0] ?? "")}
        </span>
        <div>
          <div className="text-lg font-semibold">
            {perfil.nombre} {perfil.apellidos}
          </div>
          <div className="text-sm text-ink-2">{session!.user.email}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface px-4">
        <Row k={t("vivienda")} v={vivienda?.etiqueta ?? "—"} />
        <Row k={t("role")} v={perfil.rol === "admin" ? t("admin") : t("resident")} last />
      </div>

      <div className="rounded-2xl border border-accent/25 bg-accent-soft p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[.09em] text-accent-ink">
          {t("balance")}
        </div>
        <div className="mt-1 font-mono text-2xl font-medium">
          {formatoEuros(Number(saldo ?? 0))}
        </div>
        <div className="mt-1 text-xs text-ink-2">{t("balanceHint")}</div>
      </div>

      {(movimientos ?? []).length > 0 && (
        <div className="rounded-2xl border border-line bg-surface px-4">
          {movimientos!.map((m, i) => (
            <div
              key={i}
              className={
                "flex items-center justify-between py-3 text-sm " +
                (i < movimientos!.length - 1 ? "border-b border-line" : "")
              }
            >
              <span className="text-ink-2">
                {m.motivo}
                <br />
                <span className="text-xs text-ink-3">
                  {new Date(m.creado_en).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </span>
              <span
                className={
                  "font-mono font-semibold " +
                  (m.tipo === "abono" ? "text-accent-ink" : "text-danger")
                }
              >
                {m.tipo === "abono" ? "+" : "−"}
                {formatoEuros(m.importe_cent)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <Link
          href="/perfil/editar"
          className="flex items-center justify-between border-b border-line px-4 py-3.5 text-sm"
        >
          {t("editData")}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.8">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/nueva-contrasena"
          className="flex items-center justify-between px-4 py-3.5 text-sm"
        >
          {t("changePassword")}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.8">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <form action={logoutAction}>
        <button className="h-11 w-full rounded-xl border border-line-strong bg-surface font-semibold text-danger">
          {t("logout")}
        </button>
      </form>
    </main>
  );
}

function Row({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div className={"flex justify-between py-3.5 " + (last ? "" : "border-b border-line")}>
      <span className="text-ink-2">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
