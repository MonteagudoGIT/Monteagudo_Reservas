import { createClient } from "@/lib/supabase/server";
import { VolverPanel, AccionBtn } from "@/components/admin-ui";
import { publicarAviso, borrarAviso } from "../actions";
import AvisoForm from "./AvisoForm";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("avisos")
    .select("id, titulo, cuerpo, publicado, publicado_en, creado_en")
    .order("creado_en", { ascending: false });

  return (
    <div>
      <VolverPanel />
      <h1 className="text-xl font-semibold">Avisos</h1>
      <p className="mt-1 text-sm text-ink-2">Comunicados del administrador hacia los vecinos.</p>

      <div className="mt-4">
        <AvisoForm />
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {(data ?? []).map((a) => (
          <div key={a.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{a.titulo}</span>
              <span
                className={
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                  (a.publicado ? "bg-accent-soft text-accent-ink" : "bg-surface-2 text-ink-3")
                }
              >
                {a.publicado ? "Publicado" : "Borrador"}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-ink-2">{a.cuerpo}</p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <AccionBtn action={borrarAviso.bind(null, a.id)} variant="danger" confirmText="¿Borrar el aviso?">
                Borrar
              </AccionBtn>
              <AccionBtn
                action={publicarAviso.bind(null, a.id, !a.publicado)}
                variant={a.publicado ? "ghost" : "primary"}
              >
                {a.publicado ? "Despublicar" : "Publicar"}
              </AccionBtn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
