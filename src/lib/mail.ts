import "server-only";
import nodemailer from "nodemailer";

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

/** true si hay credenciales SMTP configuradas. */
export const mailConfigurado = Boolean(user && pass);

const transporter = mailConfigurado
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: { user, pass },
    })
  : null;

/** Envía un correo. No lanza: devuelve {ok:false} si falla o no hay SMTP. */
export async function enviarMail(
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!transporter) return { ok: false, skipped: true };
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `Monteagudo <${user}>`,
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
