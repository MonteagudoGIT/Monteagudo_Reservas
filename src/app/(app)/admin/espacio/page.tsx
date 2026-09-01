import { createClient } from "@/lib/supabase/server";
import { VolverPanel } from "@/components/admin-ui";
import { TarifasForm, FichaForm, PagoForm } from "./EspacioForms";

const eur = (cent: number) => (cent / 100).toFixed(2).replace(".", ",");

export default async function Page() {
  const supabase = await createClient();
  const [{ data: tarifas }, { data: esp }] = await Promise.all([
    supabase.from("tarifas").select("modo, precio_cent, requiere_aprobacion, dias_antelacion"),
    supabase
      .from("espacios")
      .select("aforo, equipamiento, normas, iban, titular_cuenta, concepto_pago")
      .eq("clave", "sala")
      .single(),
  ]);

  const sala = tarifas?.find((t) => t.modo === "sala");
  const ping = tarifas?.find((t) => t.modo === "ping_pong");

  return (
    <div>
      <VolverPanel />
      <h1 className="text-xl font-semibold">Espacio y tarifas</h1>
      <div className="mt-4 flex flex-col gap-4">
        <TarifasForm
          salaEur={eur(sala?.precio_cent ?? 0)}
          pingEur={eur(ping?.precio_cent ?? 0)}
          reqSala={!!sala?.requiere_aprobacion}
          reqPing={!!ping?.requiere_aprobacion}
          antSala={String(sala?.dias_antelacion ?? 30)}
          antPing={String(ping?.dias_antelacion ?? 7)}
        />
        <FichaForm
          aforo={esp?.aforo != null ? String(esp.aforo) : ""}
          equipamiento={(esp?.equipamiento ?? []).join(", ")}
          normas={esp?.normas ?? ""}
        />
        <PagoForm
          iban={esp?.iban ?? ""}
          titular={esp?.titular_cuenta ?? ""}
          concepto={esp?.concepto_pago ?? "Reserva {espacio} {fecha}"}
        />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
