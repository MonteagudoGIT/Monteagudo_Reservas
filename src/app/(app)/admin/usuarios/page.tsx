import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { VolverPanel, AccionBtn } from "@/components/admin-ui";
import { setEstadoUsuario } from "../actions";

export default async function Page() {
  const session = await getSessionUser();
  const supabase = await createClient();

  const { data: perfiles } = await supabase
    .from("perfiles")
    .select("id, nombre, apellidos, rol, estado, creado_en, viviendas(etiqueta)")
    .order("creado_en", { ascending: false });

  let emails: Record<string, string> = {};
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    emails = Object.fromEntries((data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  } catch {
    // sin service_role: seguimos sin emails
  }

  return (
    <div>
      <VolverPanel />
      <h1 className="text-xl font-semibold">Usuarios</h1>
      <p className="mt-1 text-sm text-ink-2">
        {perfiles?.length ?? 0} vecinos. Desactivar impide el acceso pero no borra nada.
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        {(perfiles ?? []).map((p) => {
          const viv = Array.isArray(p.viviendas) ? p.viviendas[0] : p.viviendas;
          const yo = p.id === session!.user.id;
          const nuevo = Date.now() - new Date(p.creado_en).getTime() < 7 * 864e5;
          return (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5">
              <div className="min-w-0">
                <div className="font-semibold">
                  {p.nombre} {p.apellidos}
                  {p.rol === "admin" ? " · admin" : ""}
                  {nuevo ? (
                    <span className="ml-1.5 rounded-full bg-amber-soft px-1.5 py-0.5 text-[10px] font-semibold text-amber">
                      nuevo
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-xs text-ink-3">
                  {viv?.etiqueta ?? "sin vivienda"}
                  {emails[p.id] ? ` · ${emails[p.id]}` : ""}
                </div>
              </div>
              {yo ? (
                <span className="text-xs text-ink-3">Tú</span>
              ) : p.estado === "activa" ? (
                <AccionBtn action={setEstadoUsuario.bind(null, p.id, "desactivada")} variant="danger">
                  Desactivar
                </AccionBtn>
              ) : (
                <AccionBtn action={setEstadoUsuario.bind(null, p.id, "activa")}>Activar</AccionBtn>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
