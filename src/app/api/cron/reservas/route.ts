import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarMail, mailConfigurado } from "@/lib/mail";
import { formatoEuros } from "@/lib/reservas";

export const dynamic = "force-dynamic";

function diasRestantes(hasta: string) {
  return Math.max(0, Math.ceil((new Date(hasta).getTime() - Date.now()) / 86_400_000));
}
function fechaLegible(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Tarea programada (Cron de Vercel, ~09:00 Europe/Madrid — ver vercel.json):
//  1. Caduca las reservas retenidas por transferencia que pasan de 3 días.
//  2. Mientras sigan pendientes, avisa por correo al vecino y a la administración.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: caducadasData, error: errCaducar } = await supabase.rpc("caducar_retenidas");
  if (errCaducar) {
    return NextResponse.json({ ok: false, error: errCaducar.message }, { status: 500 });
  }
  const caducadas = Number(caducadasData ?? 0);

  const { data: pendientes } = await supabase
    .from("reservas")
    .select("id, modo, fecha, inicio, importe_cent, retenida_hasta, usuario_id, vivienda_id")
    .eq("estado", "retenida")
    .eq("metodo_pago", "transferencia");

  let avisos = 0;

  if (mailConfigurado && pendientes && pendientes.length > 0) {
    const [{ data: esp }, { data: adminPerfiles }] = await Promise.all([
      supabase.from("espacios").select("iban, titular_cuenta, concepto_pago").eq("clave", "sala").single(),
      supabase.from("perfiles").select("id").eq("rol", "admin"),
    ]);

    const adminEmails: string[] = [];
    for (const p of adminPerfiles ?? []) {
      const { data } = await supabase.auth.admin.getUserById(p.id as string);
      if (data.user?.email) adminEmails.push(data.user.email);
    }

    const vivCache = new Map<string, string>();
    const etiquetaVivienda = async (vid: string) => {
      if (vivCache.has(vid)) return vivCache.get(vid)!;
      const { data } = await supabase.from("viviendas").select("etiqueta").eq("id", vid).maybeSingle();
      const et = data?.etiqueta ?? "";
      vivCache.set(vid, et);
      return et;
    };

    for (const r of pendientes) {
      const restantes = diasRestantes(r.retenida_hasta as string);
      const etiqueta = r.vivienda_id ? await etiquetaVivienda(r.vivienda_id as string) : "";
      const espacioNombre = r.modo === "ping_pong" ? "Ping Pong" : "Sala";
      const concepto = (esp?.concepto_pago ?? "Reserva {espacio} {fecha}")
        .replace("{espacio}", espacioNombre)
        .replace("{fecha}", r.fecha as string)
        .replace("{vivienda}", etiqueta);
      const cuando = fechaLegible(r.inicio as string);
      const importe = formatoEuros(r.importe_cent as number);
      const plazo =
        restantes === 0 ? "hoy es el último día" : restantes === 1 ? "queda 1 día" : `quedan ${restantes} días`;

      if (r.usuario_id) {
        const { data } = await supabase.auth.admin.getUserById(r.usuario_id as string);
        const email = data.user?.email;
        if (email) {
          const res = await enviarMail(
            email,
            `Tu reserva de ${espacioNombre} está pendiente de pago`,
            `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;line-height:1.5">
<h2 style="color:#477358;margin:0 0 12px">Reserva pendiente de pago</h2>
<p>Tu reserva de <strong>${espacioNombre}</strong> del <strong>${cuando}</strong> sigue retenida.
Para confirmarla, haz la transferencia — ${plazo} o el hueco se libera.</p>
<p><strong>Importe:</strong> ${importe}<br>
${esp?.iban ? `<strong>IBAN:</strong> ${esp.iban}<br>` : ""}${esp?.titular_cuenta ? `<strong>Titular:</strong> ${esp.titular_cuenta}<br>` : ""}<strong>Concepto:</strong> ${concepto}</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
<p style="font-size:12px;color:#6b7280">Este buzón no se atiende. Entra en la app para ver tu reserva.</p>
</div>`,
          );
          if (res.ok) avisos++;
        }
      }

      for (const a of adminEmails) {
        const res = await enviarMail(
          a,
          `Transferencia pendiente de validar · ${espacioNombre} ${r.fecha}`,
          `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;line-height:1.5">
<h2 style="color:#477358;margin:0 0 12px">Transferencia pendiente</h2>
<p>Reserva de <strong>${espacioNombre}</strong>${etiqueta ? ` · ${etiqueta}` : ""} del <strong>${cuando}</strong>,
importe <strong>${importe}</strong>, aún sin validar.
${restantes === 0 ? "Caduca hoy si no se valida." : `Caduca en ${restantes} día${restantes === 1 ? "" : "s"}.`}</p>
<p>Revísala en <strong>Admin → Transferencias</strong>.</p>
</div>`,
        );
        if (res.ok) avisos++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    caducadas,
    pendientes: pendientes?.length ?? 0,
    avisos,
    mail: mailConfigurado,
  });
}
