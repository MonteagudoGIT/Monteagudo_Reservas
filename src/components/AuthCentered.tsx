import Image from "next/image";
import type { ReactNode } from "react";

/** Pantallas de autenticación cortas: logo centrado + contenido. */
export default function AuthCentered({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center overflow-y-auto px-6 py-6">
      <Image
        src="/monteagudo-wordmark.png"
        alt="Monteagudo"
        width={280}
        height={33}
        priority
        className="mx-auto mb-6 h-auto w-full max-w-[16rem]"
      />
      {children}
    </div>
  );
}
