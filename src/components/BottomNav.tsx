"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const IconInicio = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);
const IconCalendario = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
  </svg>
);
const IconReservas = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M4 7.5h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
    <path d="M14 7.5v11" />
  </svg>
);
const IconPerfil = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5.5 20c1.6-3.6 11.4-3.6 13 0" />
  </svg>
);

const TABS = [
  { href: "/", label: "Inicio", icon: IconInicio, exact: true },
  { href: "/calendario", label: "Calendario", icon: IconCalendario },
  { href: "/mis-reservas", label: "Mis reservas", icon: IconReservas },
  { href: "/perfil", label: "Perfil", icon: IconPerfil },
];

export default function BottomNav() {
  const pathname = usePathname();
  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="sticky bottom-0 z-20 flex items-end justify-between border-t border-line bg-surface/95 px-5 pb-4 pt-2.5 backdrop-blur">
      <Tab {...TABS[0]} on={active(TABS[0].href, true)} />
      <Tab {...TABS[1]} on={active(TABS[1].href)} />

      <Link
        href="/reservar"
        className="-mt-5 flex flex-col items-center gap-1.5 text-[11px] font-semibold text-accent-ink"
      >
        <span className="flex size-[52px] items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_18px_-6px_rgba(71,115,88,.55)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        Reservar
      </Link>

      <Tab {...TABS[2]} on={active(TABS[2].href)} />
      <Tab {...TABS[3]} on={active(TABS[3].href)} />
    </nav>
  );
}

function Tab({
  href,
  label,
  icon,
  on,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  on: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "flex flex-col items-center gap-1 text-[11px] " +
        (on ? "font-semibold text-ink" : "text-ink-3")
      }
    >
      {icon}
      {label}
    </Link>
  );
}
