import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import ReservarWizard from "./ReservarWizard";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; hi?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSessionUser();
  const perfil = session!.perfil!;
  const supabase = await createClient();

  const [{ data: tarifas }, { data: saldo }, { data: vivienda }, { data: espacio }] =
    await Promise.all([
      supabase.from("tarifas").select("modo, precio_cent, dias_antelacion"),
      supabase.rpc("saldo_vivienda", { p_vivienda: perfil.vivienda_id }),
      supabase
        .from("viviendas")
        .select("etiqueta, bloqueada, motivo_bloqueo")
        .eq("id", perfil.vivienda_id!)
        .single(),
      supabase.from("espacios").select("aforo, equipamiento, normas").eq("clave", "sala").single(),
    ]);

  if (vivienda?.bloqueada) {
    const t = await getTranslations("reservar");
    return (
      <main className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-danger-soft">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.8" aria-hidden>
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <p className="font-semibold">{t("blockedTitle")}</p>
        <p className="text-sm text-ink-2">
          {t("blockedBody", { reason: vivienda.motivo_bloqueo || t("blockedDefault") })}
        </p>
        <a href="/" className="text-sm font-semibold text-accent-ink">
          {t("backHome")}
        </a>
      </main>
    );
  }

  const precios = {
    sala: tarifas?.find((t) => t.modo === "sala")?.precio_cent ?? 0,
    ping_pong: tarifas?.find((t) => t.modo === "ping_pong")?.precio_cent ?? 0,
  };
  const diasAntelacion = {
    sala: tarifas?.find((t) => t.modo === "sala")?.dias_antelacion ?? 7,
    ping_pong: tarifas?.find((t) => t.modo === "ping_pong")?.dias_antelacion ?? 7,
  };

  const hiNum = sp.hi ? parseInt(sp.hi, 10) : undefined;

  const ficha = {
    aforo: espacio?.aforo ?? null,
    equipamiento: (espacio?.equipamiento ?? []) as string[],
    normas: espacio?.normas ?? null,
  };

  return (
    <ReservarWizard
      precios={precios}
      diasAntelacion={diasAntelacion}
      ficha={ficha}
      saldoCent={Number(saldo ?? 0)}
      vivienda={vivienda?.etiqueta ?? ""}
      nombre={perfil.nombre ?? ""}
      fechaInicial={sp.fecha}
      hiInicial={Number.isInteger(hiNum) ? hiNum : undefined}
    />
  );
}

export const dynamic = "force-dynamic";
