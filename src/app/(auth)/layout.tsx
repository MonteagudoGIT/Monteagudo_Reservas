import type { ReactNode } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getSessionUser();
  if (session?.user) redirect("/");

  return (
    <main className="scroll-area flex h-full flex-col items-center px-6 py-14">
      <Image
        src="/monteagudo-wordmark.png"
        alt="Monteagudo"
        width={96}
        height={32}
        priority
        className="mb-8 h-7 w-auto"
      />
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
