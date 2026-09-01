import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarMail, mailConfigurado } from "@/lib/mail";

function esc(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
}

/**
 * Envía un aviso por correo a todas las cuentas activas, de una en una con pausa
 * (para no disparar el límite de Gmail). Marca el aviso como enviado al empezar,
 * para no repetir si algo se relanza.
 */
export async function enviarAviso(
  avisoId: string,
): Promise<{ enviados: number; total: number }> {
  const supabase = createAdminClient();

  const { data: aviso } = await supabase
    .from("avisos")
    .select("id, titulo, cuerpo, publicado, enviar_email, email_enviado_en")
    .eq("id", avisoId)
    .maybeSingle();

  if (
    !aviso ||
    !aviso.publicado ||
    !aviso.enviar_email ||
    aviso.email_enviado_en ||
    !mailConfigurado
  ) {
    return { enviados: 0, total: 0 };
  }

  await supabase
    .from("avisos")
    .update({ email_enviado_en: new Date().toISOString() })
    .eq("id", avisoId);

  const { data: activos } = await supabase
    .from("perfiles")
    .select("id")
    .eq("estado", "activa");
  const activeIds = new Set((activos ?? []).map((p) => p.id as string));

  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emails = (list?.users ?? [])
    .filter((u) => u.email && activeIds.has(u.id))
    .map((u) => u.email as string);

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://monteagudo-reservas.vercel.app";
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;line-height:1.5">
<h2 style="color:#477358;margin:0 0 12px">${esc(aviso.titulo)}</h2>
<div style="white-space:pre-line">${esc(aviso.cuerpo)}</div>
<p style="margin-top:18px"><a href="${site}" style="color:#2f5540">Abrir Monteagudo</a></p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
<p style="font-size:12px;color:#6b7280">Aviso de la administración de la comunidad. Este buzón no se atiende.</p>
</div>`;

  let enviados = 0;
  for (const to of emails) {
    const r = await enviarMail(to, `Aviso · ${aviso.titulo}`, html);
    if (r.ok) enviados++;
    await new Promise((res) => setTimeout(res, 1100));
  }
  return { enviados, total: emails.length };
}
