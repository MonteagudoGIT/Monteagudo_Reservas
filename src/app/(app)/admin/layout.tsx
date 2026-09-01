import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AdminHeaderTitle } from "@/components/admin-ui";

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getSessionUser();
  if (session?.perfil?.rol !== "admin") redirect("/");

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-surface px-5 py-3">
        <AdminHeaderTitle />
        <Link href="/" className="text-sm font-semibold text-accent-ink">
          Salir
        </Link>
      </header>
      <div className="scroll-area min-h-0 flex-1 px-5 py-5">{children}</div>
    </div>
  );
}
