"use client";

import React from "react";
import { Modal } from "./Modal"; // Importamos nosso novo componente Modal
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  confirmButtonVariant?: "danger" | "primary";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirmar",
  confirmButtonVariant = "danger",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const buttonClass =
    confirmButtonVariant === "danger"
      ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
      : "bg-teal-600 hover:bg-teal-700 focus-visible:ring-teal-500";

  return (
    // Utilizamos o componente Modal como base para toda a estrutura e comportamento.
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
    >
      <div className="space-y-6">
        {/* O corpo do modal é o conteúdo específico deste componente */}
        <p className="text-sm text-gray-600">{message}</p>

        {/* O rodapé com os botões de ação */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-semibold rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${buttonClass}`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
