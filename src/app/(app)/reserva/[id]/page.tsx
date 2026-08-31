import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { formatoEuros } from "@/lib/reservas";
import { EstadoPill, CancelarReserva } from "@/components/reserva-ui";
import { Alert } from "@/components/ui";

const LOC: Record<string, string> = { es: "es-ES", en: "en-GB" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nueva?: string }>;
}) {
  const { id } = await params;
  const { nueva } = await searchParams;
  const session = await getSessionUser();
  const supabase = await createClient();
  const t = await getTranslations("reservaDetalle");
  const tSpace = await getTranslations("space");
  const loc = LOC[await getLocale()] ?? "es-ES";

  const { data: r } = await supabase
    .from("reservas")
    .select(
      "id, modo, tipo_reserva, inicio, fin, estado, aprobacion, importe_cent, metodo_pago, referencia_transferencia, retenida_hasta, creada_por_admin",
    )
    .eq("id", id)
    .maybeSingle();

  if (!r) notFound();

  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleString(loc, { timeZone: "Europe/Madrid", ...o });

  const empezada = new Date(r.inicio).getTime() <= Date.now();
  const faltaMenosDeUnaHora = new Date(r.inicio).getTime() - Date.now() < 3600_000;
  const cancelable =
    ["retenida", "confirmada"].includes(r.estado) &&
    (session!.perfil!.rol === "admin" || (!empezada && !faltaMenosDeUnaHora));

  return (
    <main className="scroll-area mx-auto flex h-full w-full max-w-md flex-col gap-4 px-5 pb-8 pt-5">
      <div className="flex items-center gap-3.5">
        <Link
          href="/mis-reservas"
          className="flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <span className="font-semibold">{t("title")}</span>
      </div>

      {nueva ? <Alert kind="success">{t("created")}</Alert> : null}

      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">
            {tSpace(r.modo === "ping_pong" ? "ping_pong" : "sala")}
            {r.tipo_reserva === "junta" ? ` · ${t("junta")}` : ""}
          </span>
          <EstadoPill estado={r.estado} aprobacion={r.aprobacion} />
        </div>
        <dl className="mt-3 flex flex-col gap-1.5 text-sm">
          <Item k={t("date")} v={fmt(r.inicio, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} cap />
          <Item
            k={t("time")}
            v={`${fmt(r.inicio, { hour: "2-digit", minute: "2-digit" })} – ${fmt(r.fin, { hour: "2-digit", minute: "2-digit" })}`}
          />
          <Item k={t("amount")} v={formatoEuros(r.importe_cent)} />
          {r.metodo_pago ? <Item k={t("payment")} v={t(`method_${r.metodo_pago}` as "method_saldo")} /> : null}
        </dl>
      </div>

      {r.estado === "retenida" && r.metodo_pago === "transferencia" ? (
        <div className="rounded-2xl border border-amber/30 bg-amber-soft p-4 text-sm">
          <div className="font-semibold text-amber">{t("transferPendingTitle")}</div>
          <p className="mt-1 text-ink-2">{t("transferPendingBody")}</p>
        </div>
      ) : null}

      {r.aprobacion === "pendiente" ? (
        <div className="rounded-2xl border border-amber/30 bg-amber-soft p-4 text-sm text-ink-2">
          {t("approvalPending")}
        </div>
      ) : null}

      <div className="mt-2 rounded-2xl border border-line bg-surface-2 p-4 text-sm text-ink-2">
        {t("accessNote")}
      </div>

      {cancelable ? <CancelarReserva id={r.id} /> : null}
    </main>
  );
}

function Item({ k, v, cap }: { k: string; v: string; cap?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-2">{k}</dt>
      <dd className={"font-semibold " + (cap ? "capitalize" : "")}>{v}</dd>
    </div>
  );
}
