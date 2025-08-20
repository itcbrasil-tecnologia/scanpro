"use client";

import { Button, type ButtonProps } from "@headlessui/react";
import React from "react";
import clsx from "clsx";

// Definimos as variantes e tamanhos que nosso botão pode ter
type AppButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "success";
type AppButtonSize = "sm" | "md" | "lg" | "icon";

interface AppButtonProps extends ButtonProps {
  children: React.ReactNode;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
}

// Mapeamento de estilos para cada variante
const variantStyles: Record<AppButtonVariant, string> = {
  primary:
    "bg-teal-600 text-white data-[hover]:bg-teal-700 data-[disabled]:bg-teal-400",
  secondary:
    "bg-slate-200 text-slate-800 data-[hover]:bg-slate-300 data-[disabled]:bg-slate-200",
  danger:
    "bg-red-600 text-white data-[hover]:bg-red-700 data-[disabled]:bg-red-400",
  success:
    "bg-green-600 text-white data-[hover]:bg-green-700 data-[disabled]:bg-green-400",
  ghost: "text-gray-500 data-[hover]:text-gray-800 data-[hover]:bg-gray-100",
};

// Mapeamento de estilos para cada tamanho
const sizeStyles: Record<AppButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
  icon: "p-2",
};

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    { variant = "primary", size = "md", className, children, ...props },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        {...props}
        className={clsx(
          // Estilos base para todos os botões
          "inline-flex items-center justify-center rounded-lg font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-80",
          variantStyles[variant],
          sizeStyles[size],
          className // Permite adicionar classes customizadas externamente
        )}
      >
        {children}
      </Button>
    );
  }
);

AppButton.displayName = "AppButton";
