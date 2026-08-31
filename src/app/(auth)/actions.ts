"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

async function siteOrigin() {
  const h = await headers();
  return (
    h.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations("auth.errors");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: t("generic") };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/not confirmed/i.test(error.message))
      return { error: t("emailNotConfirmed") };
    return { error: t("invalidCredentials") };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("estado")
      .eq("id", user.id)
      .single();
    if (perfil?.estado === "desactivada") {
      await supabase.auth.signOut();
      return { error: t("disabled") };
    }
  }

  redirect("/");
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations("auth.errors");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const viviendaId = String(formData.get("vivienda_id") ?? "").trim();
  const acepta = formData.get("acepta") === "on";

  if (!nombre || !apellidos || !email || password.length < 8 || !viviendaId || !acepta) {
    return { error: t("generic") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
      data: { nombre, apellidos, vivienda_id: viviendaId },
    },
  });
  if (error) {
    if (/already|exists|registered/i.test(error.message))
      return { error: t("emailTaken") };
    return { error: t("generic") };
  }

  redirect(`/verificar-correo?email=${encodeURIComponent(email)}`);
}

export async function resendAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (email) {
    const supabase = await createClient();
    await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${await siteOrigin()}/auth/callback` },
    });
  }
  return { ok: true };
}

export async function recoverAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (email) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await siteOrigin()}/auth/callback?next=/nueva-contrasena`,
    });
  }
  // Siempre "ok": no revelamos si el email tiene cuenta.
  return { ok: true };
}
