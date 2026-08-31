import { createClient } from "@/lib/supabase/server";
import RegisterForm from "./RegisterForm";

export default async function Page() {
  const supabase = await createClient();
  const { data: viviendas } = await supabase
    .from("viviendas")
    .select("id, etiqueta")
    .eq("activa", true)
    .order("etiqueta");

  return <RegisterForm viviendas={viviendas ?? []} />;
}
