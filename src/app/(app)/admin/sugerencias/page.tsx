import { createClient } from "@/lib/supabase/server";
import { VolverPanel, AccionBtn } from "@/components/admin-ui";
import { setEstadoSugerencia } from "../actions";

const ESTADO: Record<string, string> = { nueva: "Nueva", leida: "Leída", gestionada: "Gestionada" };

function cuando(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sugerencias")
    .select("id, texto, estado, creada_en, viviendas(etiqueta)")
    .order("creada_en", { ascending: false });

  return (
    <div>
      <VolverPanel />
      <h1 className="text-xl font-semibold">Buzón de sugerencias</h1>
      <p className="mt-1 text-sm text-ink-2">
        Sugerencias de los vecinos. El reenvío por email se activará con Resend.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {(data ?? []).length === 0 && (
          <p className="rounded-xl border border-line bg-surface px-4 py-4 text-sm text-ink-3">
            No hay sugerencias.
          </p>
        )}
        {(data ?? []).map((s) => {
          const viv = Array.isArray(s.viviendas) ? s.viviendas[0] : s.viviendas;
          return (
            <div key={s.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-ink-3">
                <span>
                  {viv?.etiqueta ?? "—"} · {cuando(s.creada_en)}
                </span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 font-semibold">
                  {ESTADO[s.estado] ?? s.estado}
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-line text-sm text-ink-2">{s.texto}</p>
              <div className="mt-3 flex justify-end gap-2">
                {s.estado === "nueva" && (
                  <AccionBtn action={setEstadoSugerencia.bind(null, s.id, "leida")} variant="ghost">
                    Marcar leída
                  </AccionBtn>
                )}
                {s.estado !== "gestionada" && (
                  <AccionBtn action={setEstadoSugerencia.bind(null, s.id, "gestionada")}>
                    Gestionada
                  </AccionBtn>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
