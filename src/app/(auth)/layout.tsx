import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getSessionUser();
  if (session?.user) redirect("/");

  return <main className="flex h-full flex-col overflow-hidden">{children}</main>;
}
