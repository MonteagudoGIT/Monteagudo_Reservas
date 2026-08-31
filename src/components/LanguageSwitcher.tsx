"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLocale(next: string) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={() => setLocale("es")}
        disabled={pending}
        className={locale === "es" ? "font-semibold text-accent-ink" : "text-ink-3"}
      >
        ES
      </button>
      <span className="text-ink-3">/</span>
      <button
        type="button"
        onClick={() => setLocale("en")}
        disabled={pending}
        className={locale === "en" ? "font-semibold text-accent-ink" : "text-ink-3"}
      >
        EN
      </button>
    </div>
  );
}
