import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/auth";
import NewPasswordForm from "./NewPasswordForm";

export default async function Page() {
  const session = await getSessionUser();
  if (!session?.user) redirect("/recuperar");
  const t = await getTranslations("auth.newPassword");

  return (
    <main className="scroll-area flex h-full flex-col items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3.5">
          <Link
            href="/perfil"
            className="flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <span className="font-semibold">{t("title")}</span>
        </div>
        <NewPasswordForm />
        <Link href="/perfil" className="mt-4 block text-center text-sm font-semibold text-accent-ink">
          {t("cancel")}
        </Link>
      </div>
    </main>
  );
}
