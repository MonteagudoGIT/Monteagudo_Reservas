import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { logoutAction } from "@/app/(app)/actions";

export default async function Page() {
  const session = await getSessionUser();
  if (!session?.user) redirect("/entrar");
  if (session.perfil?.estado !== "desactivada") redirect("/");

  const t = await getTranslations("auth.errors");

  return (
    <main className="mx-auto flex h-full w-full max-w-sm flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-danger-soft">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--danger)"
          strokeWidth="1.8"
          aria-hidden
        >
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
      <p className="text-ink-2">{t("disabled")}</p>
      <form action={logoutAction}>
        <button className="h-11 rounded-xl border border-line-strong bg-surface px-5 font-semibold">
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
