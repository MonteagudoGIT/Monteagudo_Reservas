import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { logoutAction } from "./actions";

export default async function Home() {
  const session = await getSessionUser();
  const t = await getTranslations("home");

  const nombre = session?.perfil?.nombre?.trim();
  const name = nombre || session?.user.email || "";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.8"
            aria-hidden
          >
            <path d="M5 21V10a7 7 0 0 1 14 0v11" />
            <path d="M3 21h18" />
          </svg>
          <span className="font-semibold tracking-tight">Monteagudo</span>
        </div>
        <LanguageSwitcher />
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{t("greeting", { name })}</h1>
        <p className="mt-1 text-sm text-ink-2">
          {t("signedInAs", { email: session?.user.email ?? "" })}
        </p>
        {session?.perfil?.rol === "admin" ? (
          <span className="mt-2 inline-block rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-ink">
            Administrador
          </span>
        ) : null}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-ink-2">
        La autenticación ya funciona. Las pantallas de reservas, calendario y
        perfil llegan en la Fase 4.
      </div>

      <form action={logoutAction} className="mt-auto">
        <button className="h-11 w-full rounded-xl border border-line-strong bg-surface font-semibold transition-colors hover:bg-surface-2">
          {t("logout")}
        </button>
      </form>
    </main>
  );
}
