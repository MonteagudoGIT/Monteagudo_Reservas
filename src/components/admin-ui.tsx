"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Alert } from "@/components/ui";

/** El enlace al Panel vive ahora en la cabecera fija de administración (siempre visible). */
export function VolverPanel() {
  return null;
}

/** Cabecera del panel: dentro de una sección muestra una flecha de volver; en el panel, solo el título. */
export function AdminHeaderTitle() {
  const pathname = usePathname();
  const enSeccion = pathname !== "/admin";
  return (
    <Link href="/admin" className="flex items-center gap-1.5" aria-label="Volver al panel">
      {enSeccion && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
          className="text-ink-2"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      )}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
      <span className="font-semibold">Administración</span>
    </Link>
  );
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
