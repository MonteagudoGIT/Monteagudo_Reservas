import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("avisos")
    .select("id, titulo, cuerpo, publicado_en")
    .eq("publicado", true)
    .order("publicado_en", { ascending: false });

  return (
    <main className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3.5 px-5 pb-3 pt-6">
        <Link href="/" className="flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold">Avisos</h1>
      </header>

      <div className="scroll-area min-h-0 flex-1 space-y-3 px-5 pb-6 pt-1">
        {(data ?? []).length === 0 && (
          <p className="rounded-xl border border-line bg-surface px-4 py-4 text-sm text-ink-3">
            No hay avisos por ahora.
          </p>
        )}
        {(data ?? []).map((a) => (
          <div key={a.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="font-semibold">{a.titulo}</div>
            {a.publicado_en && (
              <div className="mt-0.5 text-xs text-ink-3">
                {new Date(a.publicado_en).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                })}
              </div>
            )}
            <p className="mt-2 whitespace-pre-line text-sm text-ink-2">{a.cuerpo}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
