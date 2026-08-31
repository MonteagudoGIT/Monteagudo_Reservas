"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink-2">{label}</span>
      {children}
      {hint ? <span className="text-xs text-ink-3">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={
        "h-12 rounded-xl border border-line-strong bg-surface px-3.5 text-base text-ink " +
        "outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 " +
        "disabled:opacity-60 " +
        (props.className ?? "")
      }
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={
        "h-12 rounded-xl border border-line-strong bg-surface px-3 text-base text-ink " +
        "outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 " +
        (props.className ?? "")
      }
    />
  );
}

export function Textarea(props: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={
        "min-h-28 rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-base text-ink " +
        "outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 " +
        (props.className ?? "")
      }
    />
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const look =
    variant === "primary"
      ? "bg-accent text-white hover:opacity-90"
      : "bg-surface text-ink border border-line-strong hover:bg-surface-2";
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        "flex h-12 items-center justify-center rounded-xl px-4 text-base font-semibold " +
        "transition-colors disabled:opacity-60 " +
        look +
        " " +
        className
      }
    >
      {pending ? "…" : children}
    </button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-ink-3">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function Alert({
  kind = "error",
  children,
}: {
  kind?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "bg-danger-soft text-danger",
    success: "bg-accent-soft text-accent-ink",
    info: "bg-surface-2 text-ink-2",
  }[kind];
  return (
    <div className={"rounded-xl px-3.5 py-3 text-sm " + styles} role="status">
      {children}
    </div>
  );
}
