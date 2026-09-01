import Image from "next/image";
import type { ReactNode } from "react";

/** Pantallas de autenticación cortas: logo centrado + contenido, sin scroll. */
export default function AuthCentered({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center overflow-y-auto px-6 py-3">
      <Image
        src="/monteagudo-wordmark.png"
        alt="Monteagudo"
        width={240}
        height={82}
        priority
        className="mx-auto mb-3 h-auto w-full max-w-[13rem]"
      />
      {children}
    </div>
  );
}
