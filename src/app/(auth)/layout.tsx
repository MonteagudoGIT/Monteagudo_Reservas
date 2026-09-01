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
    <main className="flex h-full flex-col overflow-y-auto px-6">
      <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center py-8">
        <Image
          src="/monteagudo-wordmark.png"
          alt="Monteagudo"
          width={240}
          height={80}
          priority
          className="mx-auto mb-7 h-10 w-auto"
        />
        {children}
      </div>
    </main>
  );
}
