"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui";

/** El enlace al Panel vive ahora en la cabecera fija de administración (siempre visible). */
export function VolverPanel() {
  return null;
}

/** Botón que ejecuta una server action (id) y refresca. */
export function AccionBtn({
  action,
  children,
  variant = "primary",
  confirmText,
}: {
  action: () => Promise<{ error?: string }>;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
  confirmText?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cls =
    variant === "primary"
      ? "bg-accent text-white"
      : variant === "danger"
        ? "border border-danger/40 bg-surface text-danger"
        : "border border-line-strong bg-surface text-ink";

  return (
    <span className="inline-flex flex-col items-end gap-1">
      {error ? <Alert>{error}</Alert> : null}
      <button
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          start(async () => {
            const r = await action();
            if (r?.error) setError(r.error);
            else router.refresh();
          });
        }}
        className={"inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold disabled:opacity-50 " + cls}
      >
        {pending ? "…" : children}
      </button>
    </span>
  );
}
