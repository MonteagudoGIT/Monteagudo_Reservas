import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hoyMadridISO } from "@/lib/reservas";

export default async function AdminPanel() {
  const supabase = await createClient();
  const hoy = hoyMadridISO();

  const [tx, apr, hoyRes, altas, intentos] = await Promise.all([
    supabase.from("reservas").select("id", { count: "exact", head: true }).eq("estado", "retenida").eq("metodo_pago", "transferencia"),
    supabase.from("reservas").select("id", { count: "exact", head: true }).eq("aprobacion", "pendiente"),
    supabase.from("reservas").select("id", { count: "exact", head: true }).eq("fecha", hoy).in("estado", ["retenida", "confirmada"]),
    supabase.from("perfiles").select("id", { count: "exact", head: true }).gte("creado_en", new Date(Date.now() - 7 * 864e5).toISOString()),
    supabase.from("intentos_bloqueados").select("id", { count: "exact", head: true }).gte("creado_en", new Date(Date.now() - 30 * 864e5).toISOString()),
  ]);

  const kpis = [
    { label: "Transferencias por validar", n: tx.count ?? 0, href: "/admin/transferencias", alerta: (tx.count ?? 0) > 0 },
    { label: "Aprobaciones pendientes", n: apr.count ?? 0, href: "/admin/aprobaciones", alerta: (apr.count ?? 0) > 0 },
    { label: "Reservas hoy", n: hoyRes.count ?? 0, href: "/admin/reservas" },
    { label: "Altas (7 días)", n: altas.count ?? 0, href: "/admin/usuarios" },
    { label: "Intentos con impago", n: intentos.count ?? 0, href: "/admin/viviendas", alerta: (intentos.count ?? 0) > 0 },
  ];

  const secciones = [
    { href: "/admin/reservas", t: "Reservas", d: "Consultar, filtrar y cancelar" },
    { href: "/admin/reservas/nueva", t: "Nueva reserva asistida", d: "Reservar por una vivienda" },
    { href: "/admin/transferencias", t: "Transferencias", d: "Validar ingresos" },
    { href: "/admin/aprobaciones", t: "Aprobaciones", d: "Sala y juntas de vecinos" },
    { href: "/admin/espacio", t: "Espacio y tarifas", d: "Precios, ficha, aprobación" },
    { href: "/admin/viviendas", t: "Viviendas", d: "Bloqueo por impago" },
    { href: "/admin/usuarios", t: "Usuarios", d: "Activar y desactivar" },
    { href: "/admin/mantenimiento", t: "Mantenimiento", d: "Cerrar tramos" },
    { href: "/admin/avisos", t: "Avisos", d: "Comunicados a los vecinos" },
    { href: "/admin/calendario", t: "Calendario global", d: "Ver toda la ocupación" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Panel</h1>

      <div className="grid grid-cols-2 gap-3">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className={
              "rounded-2xl border bg-surface p-4 " +
              (k.alerta ? "border-amber/40" : "border-line")
            }
          >
            <div className="text-xs text-ink-2">{k.label}</div>
            <div className={"mt-1 font-mono text-2xl font-medium " + (k.alerta ? "text-amber" : "")}>
              {k.n}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {secciones.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3"
          >
            <span>
              <span className="block font-semibold">{s.t}</span>
              <span className="block text-xs text-ink-3">{s.d}</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.8">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
