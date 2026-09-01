import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ResendButton from "./ResendButton";
import AuthCentered from "@/components/AuthCentered";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const t = await getTranslations("auth.verify");

  return (
    <AuthCentered>
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.7"
          aria-hidden
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M4 7l8 6 8-6" />
        </svg>
      </span>

      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-ink-2">
        {t("body", { email: email ?? "tu correo" })}
      </p>

      {email ? <ResendButton email={email} /> : null}

      <p className="text-xs text-ink-3">
        {t("wrongEmail")}{" "}
        <Link href="/crear-cuenta" className="font-semibold text-accent-ink">
          {t("changeEmail")}
        </Link>
      </p>

      <p className="mt-4 rounded-xl bg-surface-2 px-3.5 py-3 text-xs text-ink-2">
        {t("adminNote")}
      </p>

      <Link href="/entrar" className="text-sm font-semibold text-accent-ink">
        ← Entrar
      </Link>
    </div>
    </AuthCentered>
  );
}
