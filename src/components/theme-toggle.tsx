"use client";

import { useEffect, useState } from "react";

const SUN = (
  <>
    <circle cx="12" cy="12" r="4" strokeWidth="1.6" />
    <path d="M12 2.8v2M12 19.2v2M4.4 4.4l1.4 1.4M18.2 18.2l1.4 1.4M2.8 12h2M19.2 12h2M4.4 19.6l1.4-1.4M18.2 5.8l1.4-1.4" strokeWidth="1.6" strokeLinecap="round" />
  </>
);
const MOON = <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z" strokeWidth="1.6" strokeLinejoin="round" />;

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
    setReady(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.dataset.theme = "dark";
      localStorage.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
      localStorage.theme = "light";
    }
  }

  const label = ready ? (dark ? "Mudar para tema claro" : "Mudar para tema escuro") : "Alternar tema";
  const icon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-[18px] w-[18px]">
      {ready && dark ? SUN : MOON}
    </svg>
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        title={label}
        aria-label={label}
        className="grid h-9 w-9 place-items-center rounded-md text-faint transition-colors hover:bg-panel2 hover:text-dim"
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-faint transition-colors hover:bg-panel2 hover:text-dim"
    >
      {icon}
      {ready ? (dark ? "Tema claro" : "Tema escuro") : "Tema"}
    </button>
  );
}
