"use client";

import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string; // Prop opcional para o texto
  confirmButtonVariant?: "danger" | "primary"; // Prop opcional para a cor
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirmar", // Valor padrão
  confirmButtonVariant = "danger", // Valor padrão
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const buttonClass =
    confirmButtonVariant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-teal-600 hover:bg-teal-700";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex justify-end space-x-4 bg-gray-50 p-4 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md transition-colors ${buttonClass}`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
