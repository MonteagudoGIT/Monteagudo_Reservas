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
      <div className="mx-auto my-auto w-full max-w-sm py-10">
        <Image
          src="/monteagudo-wordmark.png"
          alt="Monteagudo"
          width={240}
          height={80}
          priority
          className="mx-auto mb-8 h-auto w-full max-w-[15rem]"
        />
        {children}
      </div>
    </main>
  );
}
