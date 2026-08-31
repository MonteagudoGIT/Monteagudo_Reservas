"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setLocale } from "@/app/actions/locale";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  const cambiar = (next: string) => startTransition(() => setLocale(next));

  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={() => cambiar("es")}
        disabled={pending || locale === "es"}
        className={locale === "es" ? "font-semibold text-accent-ink" : "text-ink-3"}
      >
        ES
      </button>
      <span className="text-ink-3">/</span>
      <button
        type="button"
        onClick={() => cambiar("en")}
        disabled={pending || locale === "en"}
        className={locale === "en" ? "font-semibold text-accent-ink" : "text-ink-3"}
      >
        EN
      </button>
    </div>
  );
}
