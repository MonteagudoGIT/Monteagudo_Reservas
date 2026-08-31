import { createClient } from "@/lib/supabase/server";
import { VolverPanel } from "@/components/admin-ui";
import BloqueoVivienda from "./BloqueoVivienda";

export default async function Page() {
  const supabase = await createClient();

  const [{ data: viviendas }, { data: intentos }] = await Promise.all([
    supabase.from("viviendas").select("id, etiqueta, bloqueada, motivo_bloqueo").order("etiqueta"),
    supabase
      .from("intentos_bloqueados")
      .select("id, detalle, creado_en, viviendas(etiqueta)")
      .order("creado_en", { ascending: false })
      .limit(15),
  ]);

  return (
    <div>
      <VolverPanel />
      <h1 className="text-xl font-semibold">Viviendas</h1>
      <p className="mt-1 text-sm text-ink-2">
        Una vivienda bloqueada por impago no puede reservar de ninguna forma.
      </p>

      <div className="mt-4 flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
        {(viviendas ?? []).map((v) => (
          <div key={v.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className={"font-semibold " + (v.bloqueada ? "text-danger" : "")}>{v.etiqueta}</span>
            <BloqueoVivienda id={v.id} bloqueada={v.bloqueada} motivo={v.motivo_bloqueo} />
          </div>
        ))}
      </div>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-[.09em] text-ink-3">
        Intentos de reserva bloqueados
      </h2>
      <div className="mt-2 flex flex-col gap-2">
        {(intentos ?? []).length === 0 && (
          <p className="text-sm text-ink-3">Ninguno.</p>
        )}
        {(intentos ?? []).map((i) => {
          const viv = Array.isArray(i.viviendas) ? i.viviendas[0] : i.viviendas;
          return (
            <div key={i.id} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">
              <span className="font-semibold">{viv?.etiqueta ?? "—"}</span>
              <span className="text-ink-3">
                {" "}
                · {i.detalle} ·{" "}
                {new Date(i.creado_en).toLocaleString("es-ES", {
                  timeZone: "Europe/Madrid",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
