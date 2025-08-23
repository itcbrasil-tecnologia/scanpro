"use client";

import React from "react";
import { Switch } from "@headlessui/react";
import { useTheme } from "@/providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import clsx from "clsx";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <div
      className="flex items-center"
      title={isDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
    >
      <Switch
        checked={isDarkMode}
        onChange={toggleTheme}
        className="group relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
      >
        <span className="sr-only">Alternar tema</span>
        <span
          aria-hidden="true"
          className={clsx(
            "pointer-events-none absolute mx-auto h-6 w-12 rounded-full transition-colors duration-300 ease-in-out",
            isDarkMode ? "bg-zinc-700" : "bg-slate-200"
          )}
        />
        <span
          aria-hidden="true"
          className={clsx(
            "pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-gray-200 bg-white shadow-lg ring-0 transition-transform duration-300 ease-in-out dark:border-zinc-700",
            isDarkMode ? "translate-x-8" : "translate-x-1"
          )}
        />
        <div className="absolute inset-0 flex items-center justify-around w-full">
          <Sun
            size={14}
            className={clsx(
              "transition-colors duration-300",
              isDarkMode ? "text-zinc-500" : "text-yellow-500"
            )}
          />
          <Moon
            size={14}
            className={clsx(
              "transition-colors duration-300",
              isDarkMode ? "text-sky-400" : "text-slate-500"
            )}
          />
        </div>
      </Switch>
    </div>
  );
}
