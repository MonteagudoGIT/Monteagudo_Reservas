"use client";

import { useActionState, useState } from "react";
import { reservaAsistidaAction } from "../../actions";
import { Field, Select, SubmitButton, Alert } from "@/components/ui";
import { diasReservables } from "@/lib/reservas";

type FS = { error?: string; ok?: boolean };
const initial: FS = {};
const INICIO = [10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 22];
const FIN = [11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23];

export default function ReservaAsistidaForm({
  viviendas,
}: {
  viviendas: { id: string; etiqueta: string; bloqueada: boolean }[];
}) {
  const [state, action] = useActionState<FS, FormData>(reservaAsistidaAction, initial);
  const [modo, setModo] = useState("sala");
  const dias = diasReservables();

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error ? <Alert>{state.error}</Alert> : null}

      <Field label="Vivienda" htmlFor="vivienda_id">
        <Select id="vivienda_id" name="vivienda_id" defaultValue="" required>
          <option value="" disabled>
            Elige la vivienda
          </option>
          {viviendas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.etiqueta}
              {v.bloqueada ? " — BLOQUEADA (impago)" : ""}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink-2">Uso</span>
        <div className="flex gap-2">
          {[
            ["sala", "Sala"],
            ["ping_pong", "Ping Pong"],
          ].map(([v, l]) => (
            <label
              key={v}
              className={
                "flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-semibold " +
                (modo === v ? "border-2 border-accent bg-accent-soft" : "border-line bg-surface")
              }
            >
              <input
                type="radio"
                name="modo"
                value={v}
                checked={modo === v}
                onChange={() => setModo(v)}
                className="sr-only"
              />
              {l}
            </label>
          ))}
        </div>
      </div>

      {modo === "sala" && (
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" name="junta" className="size-4" style={{ accentColor: "var(--accent)" }} />
          Es para una junta de vecinos (precio 0)
        </label>
      )}

      <Field label="Día" htmlFor="fecha">
        <Select id="fecha" name="fecha" defaultValue={dias[0].iso} required>
          {dias.map(({ iso }) => (
            <option key={iso} value={iso}>
              {new Date(iso + "T12:00:00Z").toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "UTC",
              })}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex gap-3">
        <Field label="Desde" htmlFor="hi">
          <Select id="hi" name="hi" defaultValue="17" required>
            {INICIO.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Hasta" htmlFor="hf">
          <Select id="hf" name="hf" defaultValue="21" required>
            {FIN.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <p className="-mt-2 text-xs text-ink-3">
        Horario 10–15 y 17–23 (siesta cerrada). Ping Pong máximo 2 h.
      </p>

      <SubmitButton className="mt-2">Crear reserva</SubmitButton>
    </form>
  );
}
