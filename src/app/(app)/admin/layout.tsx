import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getSessionUser();
  if (session?.perfil?.rol !== "admin") redirect("/");

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-surface px-5 py-3">
        <Link href="/admin" className="flex items-center gap-1.5" aria-label="Volver al panel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="text-ink-2">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" aria-hidden>
            <rect x="3" y="3" width="8" height="8" rx="1.5" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" />
          </svg>
          <span className="font-semibold">Administración</span>
        </Link>
        <Link href="/" className="text-sm font-semibold text-accent-ink">
          Salir
        </Link>
      </header>
      <div className="scroll-area min-h-0 flex-1 px-5 py-5">{children}</div>
    </div>
  );
}
