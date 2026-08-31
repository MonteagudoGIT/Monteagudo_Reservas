import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import NewPasswordForm from "./NewPasswordForm";

export default async function Page() {
  const session = await getSessionUser();
  if (!session?.user) redirect("/recuperar");

  return (
    <main className="flex min-h-dvh flex-col items-center px-6 py-14">
      <div className="mb-8 flex items-center gap-2">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.8"
          aria-hidden
        >
          <path d="M5 21V10a7 7 0 0 1 14 0v11" />
          <path d="M3 21h18" />
        </svg>
        <span className="text-lg font-semibold tracking-tight">Monteagudo</span>
      </div>
      <div className="w-full max-w-sm">
        <NewPasswordForm />
      </div>
    </main>
  );
}
