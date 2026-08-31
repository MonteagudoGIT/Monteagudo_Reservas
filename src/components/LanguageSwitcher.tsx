"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setLocale } from "@/app/actions/locale";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  const cambiar = (next: string) => {
    if (next !== locale) startTransition(() => setLocale(next));
  };

  return (
    <div
      className={
        "flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5 text-xs font-semibold " +
        (pending ? "opacity-60" : "")
      }
    >
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => cambiar(l)}
          disabled={pending}
          className={
            "min-w-9 rounded-md px-2.5 py-1.5 " +
            (locale === l ? "bg-surface text-ink shadow-sm" : "text-ink-3")
          }
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
