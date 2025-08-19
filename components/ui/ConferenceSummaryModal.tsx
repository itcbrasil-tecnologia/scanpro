"use client";

import React from "react";
import { Modal } from "./Modal";
import { X, FileText, MapPin } from "lucide-react";
import { ConferenceData } from "@/types";

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

  const hasPeripherals =
    conferenceData.miceCount !== undefined ||
    conferenceData.chargersCount !== undefined ||
    conferenceData.headsetsCount !== undefined;

  const totalCadastrados =
    (conferenceData.expectedCount || 0) +
    (conferenceData.maintenanceCount || 0);

  // ADICIONADO: Variáveis formatadas para uso no JSX
  const formattedDate = conferenceData.endTime
    .toDate()
    .toLocaleDateString("pt-BR");
  const formattedStartTime = conferenceData.startTime
    .toDate()
    .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const formattedEndTime = conferenceData.endTime
    .toDate()
    .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resumo da Conferência"
      icon={<FileText className="h-6 w-6 text-teal-600" />}
    >
      <div className="space-y-2 text-sm max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-x-6">
          <div className="space-y-1">
            <p>
              <span className="font-semibold">Técnico:</span>{" "}
              {conferenceData.userName}
            </p>
            <p>
              {/* ALTERADO: Usando a variável formatada */}
              <span className="font-semibold">Data:</span> {formattedDate}
            </p>
            <p>
              <span className="font-semibold">Horário:</span>{" "}
              {/* ALTERADO: Usando as variáveis formatadas */}
              {formattedStartTime} às {formattedEndTime}
            </p>
          </div>
          <div className="space-y-1">
            <p>
              <span className="font-semibold">Projeto:</span>{" "}
              {conferenceData.projectName}
            </p>
            <p>
              <span className="font-semibold">UM:</span> {conferenceData.umName}
            </p>
          </div>
        </div>

        {hasPeripherals && (
          <>
            <hr className="my-1 border-slate-200" />
            <div className="grid grid-cols-2 gap-x-6 pt-2">
              {conferenceData.miceCount !== undefined && (
                <p>
                  <span className="font-semibold">Mouses:</span>{" "}
                  {conferenceData.miceCount}
                </p>
              )}
              {conferenceData.chargersCount !== undefined && (
                <p>
                  <span className="font-semibold">Carregadores:</span>{" "}
                  {conferenceData.chargersCount}
                </p>
              )}
              {conferenceData.headsetsCount !== undefined && (
                <p>
                  <span className="font-semibold">Fones:</span>{" "}
                  {conferenceData.headsetsCount}
                </p>
              )}
            </div>
          </>
        )}

        {conferenceData.latitude && conferenceData.longitude && (
          <>
            <hr className="my-1 border-slate-200" />
            <div className="pt-2">
              <p className="font-semibold flex items-center mb-1">
                <MapPin size={14} className="mr-2" /> Localização Registrada:
              </p>
              <a
                href={`http://googleusercontent.com/maps.google.com/?q=${conferenceData.latitude},${conferenceData.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:underline text-sm font-medium"
              >
                Ver no Mapa
              </a>
            </div>
          </>
        )}

        <hr className="my-1 border-slate-200" />

        <div className="space-y-1 mt-2">
          <p>
            <span className="font-semibold">
              Total de Dispositivos Cadastrados:
            </span>{" "}
            {totalCadastrados}
          </p>
          <p>
            <span className="font-semibold">
              Total de Dispositivos (Ativos):
            </span>{" "}
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
        </div>

        {conferenceData.missingCount !== undefined &&
          conferenceData.missingCount > 0 && (
            <div className="pt-2">
              <h4 className="font-semibold">Dispositivos Faltantes:</h4>
              <ul className="text-xs max-h-20 overflow-y-auto bg-slate-100 p-2 rounded-md mt-1 font-mono">
                {conferenceData.missingDevices?.map((device: string) => (
                  <li key={device}>{device}</li>
                ))}
              </ul>
            </div>
          )}

        {conferenceData.maintenanceCount !== undefined &&
          conferenceData.maintenanceCount > 0 && (
            <div className="pt-2">
              <h4 className="font-semibold">Dispositivos em Manutenção:</h4>
              <ul className="text-xs max-h-20 overflow-y-auto bg-slate-100 p-2 rounded-md mt-1 font-mono">
                {conferenceData.maintenanceDevices?.map((device: string) => (
                  <li key={device}>{device}</li>
                ))}
              </ul>
            </div>
          )}
      </div>
      <div className="flex justify-end pt-4 mt-4 border-t">
        <button
          onClick={onClose}
          className="flex items-center justify-center bg-slate-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
        >
          <X size={20} className="mr-2" />
          Fechar
        </button>
      </div>
    </Modal>
  );
}
