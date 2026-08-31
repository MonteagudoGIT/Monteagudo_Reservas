import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getSessionUser();
  if (!session?.user) redirect("/entrar");
  if (session.perfil?.estado === "desactivada") redirect("/cuenta-desactivada");

  // Cuentas por Google que aún no han elegido vivienda.
  const perfil = session.perfil;
  if (!perfil || (!perfil.vivienda_id && !perfil.vivienda_texto)) {
    redirect("/completar-perfil");
  }

  return <>{children}</>;
}
