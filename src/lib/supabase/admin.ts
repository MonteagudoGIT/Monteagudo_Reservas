import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role: salta las políticas RLS.
 * SOLO servidor (Route Handlers, Server Actions, tareas). Nunca en el cliente.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
