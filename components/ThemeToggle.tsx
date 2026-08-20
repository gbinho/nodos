"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("nodos-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextDark = saved ? saved === "dark" : prefersDark;
    setDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
  }, []);

  function toggle() {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    window.localStorage.setItem("nodos-theme", nextDark ? "dark" : "light");
  }

  return (
    <button type="button" onClick={toggle} aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"} title={dark ? "Tema claro" : "Tema escuro"} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-white/30 hover:text-white active:scale-90">
      {dark ? <Sun className="h-4 w-4" strokeWidth={1.7} /> : <Moon className="h-4 w-4" strokeWidth={1.7} />}
    </button>
  );
}
