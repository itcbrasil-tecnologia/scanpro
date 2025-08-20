"use client";

import React from "react";
import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";
import { AppButton } from "./AppButton"; // ADICIONADO

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

  // A variável buttonClass não é mais necessária.

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-600">{message}</p>

        {/* REFATORADO: Botões de ação */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
          <AppButton variant="secondary" onClick={onClose}>
            Cancelar
          </AppButton>
          <AppButton variant={confirmButtonVariant} onClick={onConfirm}>
            {confirmButtonText}
          </AppButton>
        </div>
      </div>
    </Modal>
  );
}
