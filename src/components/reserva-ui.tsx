"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cancelarReservaAction } from "@/app/(app)/reserva/actions";
import { Alert } from "@/components/ui";

export function EstadoPill({
  estado,
  aprobacion,
}: {
  estado: string;
  aprobacion?: string;
}) {
  const t = useTranslations("estados");
  let key = estado;
  let cls = "bg-surface-2 text-ink-2";
  if (aprobacion === "pendiente") {
    key = "pendiente_aprobacion";
    cls = "bg-amber-soft text-amber";
  } else if (estado === "confirmada") {
    cls = "bg-accent-soft text-accent-ink";
  } else if (estado === "retenida") {
    cls = "bg-amber-soft text-amber";
  } else if (estado === "cancelada") {
    cls = "bg-danger-soft text-danger";
  }

  return (
    <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + cls}>
      {t(key as "confirmada")}
    </span>
  );
}

export function CancelarReserva({ id }: { id: string }) {
  const router = useRouter();
  const t = useTranslations("reservaDetalle");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  if (!confirmar) {
    return (
      <button
        onClick={() => setConfirmar(true)}
        className="flex h-12 items-center justify-center rounded-xl border border-danger/40 bg-surface font-semibold text-danger"
      >
        {t("cancel")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <Alert>{error}</Alert> : null}
      <p className="text-sm text-ink-2">{t("confirmCancel")}</p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirmar(false)}
          className="h-11 flex-1 rounded-xl border border-line-strong bg-surface font-semibold"
        >
          {t("no")}
        </button>
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await cancelarReservaAction(id);
              if (r.error) setError(r.error);
              else router.refresh();
            })
          }
          className="h-11 flex-1 rounded-xl bg-danger font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : t("yesCancel")}
        </button>
      </div>
    </div>
  );
}
