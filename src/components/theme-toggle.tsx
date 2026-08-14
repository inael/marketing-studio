"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
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

  return (
    <button
      type="button"
      onClick={toggle}
      title="Alternar tema claro/escuro"
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-faint transition-colors hover:bg-panel2 hover:text-dim"
    >
      <span aria-hidden className="text-sm leading-none">
        {ready ? (dark ? "☀️" : "🌙") : "🌗"}
      </span>
      {ready ? (dark ? "Tema claro" : "Tema escuro") : "Tema"}
    </button>
  );
}
