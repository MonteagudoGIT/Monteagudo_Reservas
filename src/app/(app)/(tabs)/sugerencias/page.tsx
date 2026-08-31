import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import SugerenciaForm from "./SugerenciaForm";

const LOC: Record<string, string> = { es: "es-ES", en: "en-GB" };

export default async function Page() {
  const session = await getSessionUser();
  const supabase = await createClient();
  const t = await getTranslations("sugerencias");
  const loc = LOC[await getLocale()] ?? "es-ES";

  const { data: mias } = await supabase
    .from("sugerencias")
    .select("id, texto, estado, creada_en")
    .eq("usuario_id", session!.user.id)
    .order("creada_en", { ascending: false })
    .limit(20);

  return (
    <main className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3.5 px-5 pb-3 pt-6">
        <Link href="/perfil" className="flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
      </header>

      <div className="scroll-area min-h-0 flex-1 space-y-5 px-5 pb-6 pt-1">
        <p className="text-sm text-ink-2">{t("subtitle")}</p>
        <SugerenciaForm />

        {(mias ?? []).length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[.09em] text-ink-3">{t("mine")}</div>
            {mias!.map((s) => (
              <div key={s.id} className="rounded-xl border border-line bg-surface p-3.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-ink-3">
                    {new Date(s.creada_en).toLocaleDateString(loc, { day: "numeric", month: "short" })}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-ink-2">
                    {t(`st_${s.estado}` as "st_nueva")}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-ink-2">{s.texto}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
