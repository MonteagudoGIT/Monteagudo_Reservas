import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import EditarPerfilForm from "./EditarPerfilForm";

export default async function Page() {
  const session = await getSessionUser();
  const perfil = session!.perfil!;
  const supabase = await createClient();
  const { data: vivienda } = await supabase
    .from("viviendas")
    .select("etiqueta")
    .eq("id", perfil.vivienda_id!)
    .single();

  return (
    <main className="flex flex-col gap-4 px-5 pb-6 pt-5">
      <div className="flex items-center gap-3.5">
        <Link
          href="/perfil"
          className="flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <span className="font-semibold">Editar datos</span>
      </div>

      <EditarPerfilForm
        nombre={perfil.nombre ?? ""}
        apellidos={perfil.apellidos ?? ""}
        telefono={perfil.telefono ?? ""}
        email={session!.user.email ?? ""}
        vivienda={vivienda?.etiqueta ?? ""}
      />
    </main>
  );
}
