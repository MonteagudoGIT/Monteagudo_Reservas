import { createClient } from "@/lib/supabase/server";
import { VolverPanel } from "@/components/admin-ui";
import ReservaAsistidaForm from "./ReservaAsistidaForm";

export default async function Page() {
  const supabase = await createClient();
  const { data: viviendas } = await supabase
    .from("viviendas")
    .select("id, etiqueta, bloqueada")
    .order("etiqueta");

  return (
    <div>
      <VolverPanel />
      <h1 className="text-xl font-semibold">Nueva reserva asistida</h1>
      <p className="mt-1 text-sm text-ink-2">
        A nombre de una vivienda. Queda confirmada y dada por pagada.
      </p>
      <div className="mt-3">
        <ReservaAsistidaForm viviendas={viviendas ?? []} />
      </div>
    </div>
  );
}
