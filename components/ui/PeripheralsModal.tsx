"use client";

import React from "react";
import { Modal } from "./Modal";
import { Mouse, Power, Headphones } from "lucide-react";

interface PeripheralsData {
  miceCount?: number;
  chargersCount?: number;
  headsetsCount?: number;
}

interface PeripheralsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PeripheralsData | null;
}

export function PeripheralsModal({
  isOpen,
  onClose,
  data,
}: PeripheralsModalProps) {
  if (!isOpen || !data) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Periféricos da Conferência">
      <div className="space-y-4">
        {/* CORREÇÃO: Renderização condicional para cada periférico */}
        {data.miceCount !== undefined && (
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
            <div className="flex items-center">
              <Mouse className="h-5 w-5 mr-3 text-slate-600" />
              <span className="font-medium text-slate-800">Mouses</span>
            </div>
            <span className="font-bold text-lg text-teal-700">
              {data.miceCount}
            </span>
          </div>
        )}
        {data.chargersCount !== undefined && (
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
            <div className="flex items-center">
              <Power className="h-5 w-5 mr-3 text-slate-600" />
              <span className="font-medium text-slate-800">Carregadores</span>
            </div>
            <span className="font-bold text-lg text-teal-700">
              {data.chargersCount}
            </span>
          </div>
        )}
        {data.headsetsCount !== undefined && (
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
            <div className="flex items-center">
              <Headphones className="h-5 w-5 mr-3 text-slate-600" />
              <span className="font-medium text-slate-800">
                Fones de Ouvido
              </span>
            </div>
            <span className="font-bold text-lg text-teal-700">
              {data.headsetsCount}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
