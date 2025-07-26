"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { Modal } from "@/components/ui/Modal";
import toast from "react-hot-toast";
import {
  RefreshCcw,
  CheckCircle,
  List,
  ListChecks,
  ArrowRight,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
}
interface UM {
  id: string;
  name: string;
  projectId: string;
}
interface SummaryData {
  userName?: string;
  projectName: string;
  umName?: string;
  date: string;
  startTime?: string;
  endTime: string;
  expectedCount: number;
  scannedCount: number;
  missingCount: number;
  missingDevices: string[];
}

export default function ScannerPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [ums, setUms] = useState<UM[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const umsSnapshot = await getDocs(collection(db, "ums"));
        const umsList = umsSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as UM)
        );
        setUms(umsList);

        const projectsSnapshot = await getDocs(collection(db, "projects"));
        const projectsList = projectsSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Project)
        );
        setProjects(projectsList);
      } catch (error) {
        toast.error("Erro ao carregar UMs e Projetos.", { id: "global-toast" });
        console.error("Erro ao buscar dados iniciais:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchNotebooksForUM = async () => {
      if (!selectedUmId) {
        setIsScanning(false);
        setDevicesToScan([]);
        setScannedDevices([]);
        setConferenceStartTime(null);
        return;
      }
      try {
        const notebooksQuery = query(
          collection(db, "notebooks"),
          where("umId", "==", selectedUmId)
        );
        const notebooksSnapshot = await getDocs(notebooksQuery);
        const notebooksList = notebooksSnapshot.docs
          .map((doc) => doc.data().hostname as string)
          .sort();
        setDevicesToScan(notebooksList);
        setScannedDevices([]);
        setIsScanning(true);
        setConferenceStartTime(new Date());
      } catch (error) {
        toast.error("Erro ao carregar notebooks para esta UM.", {
          id: "global-toast",
        });
        console.error("Erro ao buscar notebooks:", error);
      }
    };
    fetchNotebooksForUM();
  }, [selectedUmId]);

  const handleScan = (result: IDetectedBarcode[]) => {
    const scannedText = result[0]?.rawValue;
    if (!scannedText) return;
    if (scannedDevices.includes(scannedText)) {
      toast.error(`"${scannedText}" já escaneado.`, { id: "global-toast" });
      return;
    }
    if (devicesToScan.includes(scannedText)) {
      setDevicesToScan((previousState) =>
        previousState.filter((device) => device !== scannedText)
      );
      setScannedDevices((previousState) =>
        [...previousState, scannedText].sort()
      );
      toast.success(`"${scannedText}" Escaneado com sucesso!`, {
        id: "global-toast",
      });
    } else {
      toast.error(`"${scannedText}" não pertence a esta UM.`, {
        id: "global-toast",
      });
    }
  };

  const handleRestart = () => {
    if (scannedDevices.length === 0) {
      toast.error("Nenhum dispositivo foi escaneado para reiniciar.", {
        id: "global-toast",
      });
      return;
    }
    const allDevicesForUm = [...devicesToScan, ...scannedDevices].sort();
    setDevicesToScan(allDevicesForUm);
    setScannedDevices([]);
    setConferenceStartTime(new Date());
    toast.success("Contagem reiniciada!", { id: "global-toast" });
  };

  const handleFinalizeConference = () => {
    setIsScanning(false);
    const endTime = new Date();
    const selectedUM = ums.find((um) => um.id === selectedUmId);
    const selectedProject = projects.find(
      (project) => project.id === selectedUM?.projectId
    );
    const data: SummaryData = {
      userName: userProfile?.nome,
      projectName: selectedProject?.name || "N/A",
      umName: selectedUM?.name,
      date: endTime.toLocaleDateString("pt-BR"),
      startTime: conferenceStartTime?.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      endTime: endTime.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      expectedCount: devicesToScan.length + scannedDevices.length,
      scannedCount: scannedDevices.length,
      missingCount: devicesToScan.length,
      missingDevices: devicesToScan,
    };
    setSummaryData(data);
    setIsSummaryModalOpen(true);
  };

  const handleConcludeAndSend = async () => {
    if (!summaryData) return;

    try {
      await addDoc(collection(db, "conferences"), {
        ...summaryData,
        startTime: Timestamp.fromDate(conferenceStartTime!),
        endTime: Timestamp.now(),
        userId: userProfile?.uid,
      });

      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summaryData),
      });

      toast.success("CONFERÊNCIA ENVIADA COM SUCESSO", { id: "global-toast" });
      router.push("/inicio");
    } catch (error) {
      console.error("Erro ao concluir conferência:", error);
      toast.error("Não foi possível salvar ou notificar a conferência.", {
        id: "global-toast",
      });
    } finally {
      setIsSummaryModalOpen(false);
    }
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
          onChange={(event) => setSelectedUmId(event.target.value)}
          disabled={isLoading || isScanning}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md bg-white disabled:bg-slate-50"
        >
          <option value="">
            {isLoading ? "Carregando..." : "-- Selecione para iniciar"}
          </option>
          {ums.map((um) => (
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
              <ul className="h-48 overflow-y-auto mt-2 space-y-1 px-2">
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
              onClick={handleRestart}
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
      <Modal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title="Resumo da Conferência"
      >
        {summaryData && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold">Técnico:</span>{" "}
              {summaryData.userName}
            </p>
            <p>
              <span className="font-semibold">Projeto:</span>{" "}
              {summaryData.projectName}
            </p>
            <p>
              <span className="font-semibold">UM:</span> {summaryData.umName}
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
              {summaryData.expectedCount}
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
                <ul className="text-xs h-24 overflow-y-auto bg-slate-100 p-2 rounded-md mt-1 font-mono">
                  {summaryData.missingDevices.map((device: string) => (
                    <li key={device}>{device}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleConcludeAndSend}
                className="w-full flex items-center justify-center bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors"
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
