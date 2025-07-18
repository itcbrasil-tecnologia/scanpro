// app/(user)/scanner/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner"; // CORREÇÃO: IDetectedBarcode
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";
import toast from "react-hot-toast";
import {
  RefreshCcw,
  CheckCircle,
  List,
  ListChecks,
  ArrowRight,
} from "lucide-react";

// --- Interfaces e Dados Estáticos (Mock) ---
interface UM {
  id: string;
  name: string;
  projectId: string;
}
interface Notebook {
  id: string;
  hostname: string;
  umId: string;
}
interface SummaryData {
  user?: string;
  project: string;
  um?: string;
  date: string;
  startTime?: string;
  endTime: string;
  totalDevices: number;
  scannedCount: number;
  missingCount: number;
  missingDevices: string[];
}

const mockUms: UM[] = [
  { id: "um1", name: "BSBIA01", projectId: "proj1" },
  { id: "um2", name: "BSBIA02", projectId: "proj1" },
  { id: "um3", name: "SPV01", projectId: "proj2" },
];
const mockNotebooks: Notebook[] = [
  { id: "nb1", hostname: "BSBIA01-EST01", umId: "um1" },
  { id: "nb2", hostname: "BSBIA01-EST02", umId: "um1" },
  { id: "nb3", hostname: "BSBIA01-EST03", umId: "um1" },
  { id: "nb4", hostname: "SPV01-ADV", umId: "um3" },
  { id: "nb5", hostname: "SPV01-REC01", umId: "um3" },
];
// --- Fim dos Dados Estáticos ---

export default function ScannerPage() {
  const { userProfile } = useAuth();
  const router = useRouter();

  const [selectedUmId, setSelectedUmId] = useState<string>("");
  const [devicesToScan, setDevicesToScan] = useState<string[]>([]);
  const [scannedDevices, setScannedDevices] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const [conferenceStartTime, setConferenceStartTime] = useState<Date | null>(
    null
  );
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  useEffect(() => {
    if (selectedUmId) {
      const initialDevices = mockNotebooks
        .filter((nb) => nb.umId === selectedUmId)
        .map((nb) => nb.hostname)
        .sort();

      setDevicesToScan(initialDevices);
      setScannedDevices([]);
      setIsScanning(true);
      setConferenceStartTime(new Date());
    } else {
      setIsScanning(false);
      setDevicesToScan([]);
      setConferenceStartTime(null);
    }
  }, [selectedUmId]);

  const handleScan = (result: IDetectedBarcode[]) => {
    // CORREÇÃO: IDetectedBarcode
    const scannedText = result[0]?.rawValue;
    if (!scannedText) return;

    if (scannedDevices.includes(scannedText)) {
      toast.error(`"${scannedText}" já escaneado.`);
      return;
    }

    if (devicesToScan.includes(scannedText)) {
      setDevicesToScan((prev) =>
        prev.filter((device) => device !== scannedText)
      );
      setScannedDevices((prev) => [...prev, scannedText].sort());
      toast.success(`"${scannedText}" Escaneado com sucesso!`);
    }
  };

  const handleFinalizeConference = () => {
    setIsScanning(false);
    const endTime = new Date();
    const selectedUM = mockUms.find((um) => um.id === selectedUmId);

    const data: SummaryData = {
      user: userProfile?.nome,
      project: `Nome do Projeto (ID: ${selectedUM?.projectId})`,
      um: selectedUM?.name,
      date: endTime.toLocaleDateString("pt-BR"),
      startTime: conferenceStartTime?.toLocaleTimeString("pt-BR"),
      endTime: endTime.toLocaleTimeString("pt-BR"),
      totalDevices: devicesToScan.length + scannedDevices.length,
      scannedCount: scannedDevices.length,
      missingCount: devicesToScan.length,
      missingDevices: devicesToScan,
    };
    setSummaryData(data);
    setIsSummaryModalOpen(true);
  };

  const handleConcludeAndSend = () => {
    console.log("Enviando para o Telegram:", summaryData);
    setIsSummaryModalOpen(false);
    toast.success("CONFERÊNCIA ENVIADA COM SUCESSO");
    router.push("/inicio");
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <label
          htmlFor="um-select"
          className="block text-sm font-medium text-gray-700"
        >
          1. Selecione a Unidade Móvel (UM)
        </label>
        <select
          id="um-select"
          value={selectedUmId}
          onChange={(e) => setSelectedUmId(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white"
        >
          <option value="">-- Selecione para iniciar --</option>
          {mockUms.map((um) => (
            <option key={um.id} value={um.id}>
              {um.name}
            </option>
          ))}
        </select>
      </div>

      {isScanning && (
        <>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-bold text-center mb-2">
              2. Escaneie os QR Codes
            </h3>
            <div className="w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-dashed">
              <Scanner
                onScan={handleScan}
                allowMultiple={false}
                components={{ finder: false }}
                styles={{ container: { width: "100%" } }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-bold text-gray-700 flex items-center">
                <List className="mr-2" />A SEREM ESCANEADOS (
                {devicesToScan.length})
              </h3>
              <ul className="h-48 overflow-y-auto mt-2 space-y-1 pr-2">
                {devicesToScan.map((device) => (
                  <li
                    key={device}
                    className="p-2 bg-red-50 text-red-800 rounded font-mono text-sm"
                  >
                    {device}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-bold text-gray-700 flex items-center">
                <ListChecks className="mr-2" />
                ESCANEADOS ({scannedDevices.length})
              </h3>
              <ul className="h-48 overflow-y-auto mt-2 space-y-1 pr-2">
                {scannedDevices.map((device) => (
                  <li
                    key={device}
                    className="p-2 bg-green-50 text-green-800 rounded font-mono text-sm"
                  >
                    {device}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
            <button
              onClick={() => setSelectedUmId("")}
              className="flex items-center bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <RefreshCcw size={20} className="mr-2" /> REINICIAR
            </button>
            <button
              onClick={handleFinalizeConference}
              className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              FINALIZAR CONFERÊNCIA <CheckCircle size={20} className="ml-2" />
            </button>
          </div>
        </>
      )}

      {/* Modal de Resumo da Conferência */}
      <Modal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title="Resumo da Conferência"
      >
        {summaryData && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold">Técnico:</span> {summaryData.user}
            </p>
            <p>
              <span className="font-semibold">Projeto:</span>{" "}
              {summaryData.project}
            </p>
            <p>
              <span className="font-semibold">UM:</span> {summaryData.um}
            </p>
            <p>
              <span className="font-semibold">Data:</span> {summaryData.date}
            </p>
            <p>
              <span className="font-semibold">Horário:</span>{" "}
              {summaryData.startTime} às {summaryData.endTime}
            </p>
            <hr />
            <p>
              <span className="font-semibold">Total de Dispositivos:</span>{" "}
              {summaryData.totalDevices}
            </p>
            <p>
              <span className="font-semibold text-green-600">Escaneados:</span>{" "}
              {summaryData.scannedCount}
            </p>
            <p>
              <span className="font-semibold text-red-600">
                Não Escaneados:
              </span>{" "}
              {summaryData.missingCount}
            </p>
            {summaryData.missingCount > 0 && (
              <div>
                <h4 className="font-semibold mt-2">Dispositivos Faltantes:</h4>
                <ul className="text-xs h-24 overflow-y-auto bg-gray-100 p-2 rounded-md mt-1 font-mono">
                  {summaryData.missingDevices.map((device: string) => (
                    <li key={device}>{device}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleConcludeAndSend}
                className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                CONCLUIR E ENVIAR <ArrowRight size={20} className="ml-2" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
