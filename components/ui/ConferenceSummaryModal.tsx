"use client";

import React from "react";
import { Modal } from "./Modal";
import { X } from "lucide-react";

// Interface para os dados que o modal espera receber
interface ConferenceData {
  userName?: string;
  projectName?: string;
  umName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  expectedCount?: number;
  scannedCount?: number;
  missingCount?: number;
  scannedDevices?: string[];
  missingDevices?: string[];
  maintenanceDevices?: string[];
  maintenanceCount?: number;
  miceCount?: number;
  chargersCount?: number;
  headsetsCount?: number;
}

interface ConferenceSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conferenceData: ConferenceData | null;
}

export function ConferenceSummaryModal({
  isOpen,
  onClose,
  conferenceData,
}: ConferenceSummaryModalProps) {
  if (!isOpen || !conferenceData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resumo da Conferência">
      <div className="space-y-3 text-sm">
        <p>
          <span className="font-semibold">Técnico:</span>{" "}
          {conferenceData.userName}
        </p>
        <p>
          <span className="font-semibold">Projeto:</span>{" "}
          {conferenceData.projectName}
        </p>
        <p>
          <span className="font-semibold">UM:</span> {conferenceData.umName}
        </p>
        <p>
          <span className="font-semibold">Data:</span> {conferenceData.date}
        </p>
        <p>
          <span className="font-semibold">Horário:</span>{" "}
          {conferenceData.startTime} às {conferenceData.endTime}
        </p>

        {conferenceData.miceCount !== undefined && (
          <>
            <hr />
            <div className="grid grid-cols-2 gap-x-4">
              <p>
                <span className="font-semibold">Mouses:</span>{" "}
                {conferenceData.miceCount}
              </p>
              <p>
                <span className="font-semibold">Carregadores:</span>{" "}
                {conferenceData.chargersCount}
              </p>
              <p>
                <span className="font-semibold">Fones:</span>{" "}
                {conferenceData.headsetsCount}
              </p>
            </div>
          </>
        )}

        <hr />
        <p>
          <span className="font-semibold">Total de Dispositivos (Ativos):</span>{" "}
          {conferenceData.expectedCount}
        </p>
        <p>
          <span className="font-semibold text-green-600">Escaneados:</span>{" "}
          {conferenceData.scannedCount}
        </p>
        <p>
          <span className="font-semibold text-red-600">
            Não Escaneados (Faltantes):
          </span>{" "}
          {conferenceData.missingCount}
        </p>

        {conferenceData.maintenanceCount !== undefined &&
          conferenceData.maintenanceCount > 0 && (
            <p>
              <span className="font-semibold text-amber-600">
                Em Manutenção:
              </span>{" "}
              {conferenceData.maintenanceCount}
            </p>
          )}

        {conferenceData.missingCount !== undefined &&
          conferenceData.missingCount > 0 && (
            <div>
              <h4 className="font-semibold mt-2">Dispositivos Faltantes:</h4>
              <ul className="text-xs h-24 overflow-y-auto bg-slate-100 p-2 rounded-md mt-1 font-mono">
                {conferenceData.missingDevices?.map((device: string) => (
                  <li key={device}>{device}</li>
                ))}
              </ul>
            </div>
          )}
        {conferenceData.maintenanceCount !== undefined &&
          conferenceData.maintenanceCount > 0 && (
            <div>
              <h4 className="font-semibold mt-2">
                Dispositivos em Manutenção:
              </h4>
              <ul className="text-xs h-24 overflow-y-auto bg-slate-100 p-2 rounded-md mt-1 font-mono">
                {conferenceData.maintenanceDevices?.map((device: string) => (
                  <li key={device}>{device}</li>
                ))}
              </ul>
            </div>
          )}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="flex items-center justify-center bg-slate-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <X size={20} className="mr-2" />
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
