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
  writeBatch,
  doc,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";
import { Modal } from "@/components/ui/Modal";
import toast from "react-hot-toast";
import {
  RefreshCcw,
  CheckCircle,
  List,
  ListChecks,
  ArrowRight,
  Mouse,
  Power,
  Headphones,
  Wrench,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface UM {
  id: string;
  name: string;
  projectId: string;
  expectedPeripherals?: string[];
}

interface Notebook {
  hostname: string;
  status?: "Ativo" | "Em Manutenção";
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
  scannedDevices: string[];
  missingDevices: string[];
  maintenanceDevices?: string[];
  maintenanceCount?: number;
  miceCount?: number;
  chargersCount?: number;
  headsetsCount?: number;
}

const AVAILABLE_PERIPHERALS = ["mouse", "carregador", "fone"];

export default function ScannerPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [ums, setUms] = useState<UM[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUmId, setSelectedUmId] = useState<string>("");

  const [devicesToScan, setDevicesToScan] = useState<string[]>([]);
  const [maintenanceDevices, setMaintenanceDevices] = useState<string[]>([]);
  const [scannedDevices, setScannedDevices] = useState<string[]>([]);
  const [expectedPeripherals, setExpectedPeripherals] = useState<string[]>([]);

  const [conferenceStartTime, setConferenceStartTime] = useState<Date | null>(
    null
  );
  const [step, setStep] = useState<"selection" | "scanning" | "peripherals">(
    "selection"
  );
  const [miceCount, setMiceCount] = useState(0);
  const [chargersCount, setChargersCount] = useState(0);
  const [headsetsCount, setHeadsetsCount] = useState(0);
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
        setStep("selection");
        setDevicesToScan([]);
        setMaintenanceDevices([]);
        setScannedDevices([]);
        setExpectedPeripherals([]);
        setConferenceStartTime(null);
        return;
      }
      try {
        const selectedUMData = ums.find((um) => um.id === selectedUmId);
        setExpectedPeripherals(
          selectedUMData?.expectedPeripherals ?? AVAILABLE_PERIPHERALS
        );

        const notebooksQuery = query(
          collection(db, "notebooks"),
          where("umId", "==", selectedUmId)
        );
        const notebooksSnapshot = await getDocs(notebooksQuery);
        const notebooksList: Notebook[] = notebooksSnapshot.docs.map(
          (doc) => doc.data() as Notebook
        );
        const active = notebooksList
          .filter((n) => n.status !== "Em Manutenção")
          .map((n) => n.hostname)
          .sort();
        const maintenance = notebooksList
          .filter((n) => n.status === "Em Manutenção")
          .map((n) => n.hostname)
          .sort();

        setDevicesToScan(active);
        setMaintenanceDevices(maintenance);
        setScannedDevices([]);
        setStep("scanning");
        setConferenceStartTime(new Date());
      } catch (error) {
        toast.error("Erro ao carregar notebooks para esta UM.", {
          id: "global-toast",
        });
        console.error("Erro ao carregar notebooks:", error);
      }
    };
    fetchNotebooksForUM();
  }, [selectedUmId, ums]);

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
      toast.error(
        `"${scannedText}" não pertence a esta UM ou está em manutenção.`,
        { id: "global-toast" }
      );
    }
  };

  const handleRestart = () => {
    if (scannedDevices.length === 0) {
      toast.error("Nenhum dispositivo foi escaneado para reiniciar.", {
        id: "global-toast",
      });
      return;
    }
    const allActiveDevices = [...devicesToScan, ...scannedDevices].sort();
    setDevicesToScan(allActiveDevices);
    setScannedDevices([]);
    setConferenceStartTime(new Date());
    toast.success("Contagem reiniciada!", { id: "global-toast" });
  };

  const handleProceedToPeripherals = () => {
    setStep("peripherals");
  };

  const handleFinalizeConference = () => {
    const endTime = new Date();
    const selectedUM = ums.find((um) => um.id === selectedUmId);
    const selectedProject = projects.find(
      (project) => project.id === selectedUM?.projectId
    );

    const data: Partial<SummaryData> = {
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
      scannedDevices: scannedDevices,
      missingDevices: devicesToScan,
      maintenanceDevices: maintenanceDevices,
      maintenanceCount: maintenanceDevices.length,
    };

    if (expectedPeripherals.includes("mouse"))
      data.miceCount = Number(miceCount);
    if (expectedPeripherals.includes("carregador"))
      data.chargersCount = Number(chargersCount);
    if (expectedPeripherals.includes("fone"))
      data.headsetsCount = Number(headsetsCount);

    setSummaryData(data as SummaryData);
    setIsSummaryModalOpen(true);
  };

  const logConferenceLifecycleEvents = async (data: SummaryData) => {
    try {
      const allHostnames = [...data.scannedDevices, ...data.missingDevices];
      if (allHostnames.length === 0) return;
      const chunks: string[][] = [];
      for (let i = 0; i < allHostnames.length; i += 30) {
        chunks.push(allHostnames.slice(i, i + 30));
      }
      const queryPromises: Promise<QuerySnapshot<DocumentData>>[] = chunks.map(
        (chunk) => {
          const notebooksQuery = query(
            collection(db, "notebooks"),
            where("hostname", "in", chunk)
          );
          return getDocs(notebooksQuery);
        }
      );
      const querySnapshots = await Promise.all(queryPromises);
      const hostnameToIdMap = new Map<string, string>();
      querySnapshots.forEach((snapshot) => {
        snapshot.forEach((doc) => {
          hostnameToIdMap.set(doc.data().hostname, doc.id);
        });
      });
      const batch = writeBatch(db);
      const timestamp = Timestamp.now();
      const user = userProfile?.nome || "Sistema";
      const details = `Na conferência da UM: ${data.umName}`;
      data.scannedDevices.forEach((hostname: string) => {
        const notebookId = hostnameToIdMap.get(hostname);
        if (notebookId) {
          const eventRef = doc(
            collection(db, "notebooks", notebookId, "lifecycleEvents")
          );
          batch.set(eventRef, {
            timestamp,
            user,
            details,
            eventType: "Conferência - Sucesso",
          });
        }
      });
      data.missingDevices.forEach((hostname: string) => {
        const notebookId = hostnameToIdMap.get(hostname);
        if (notebookId) {
          const eventRef = doc(
            collection(db, "notebooks", notebookId, "lifecycleEvents")
          );
          batch.set(eventRef, {
            timestamp,
            user,
            details,
            eventType: "Conferência - Faltante",
          });
        }
      });
      await batch.commit();
      console.log(
        "Eventos de ciclo de vida da conferência registrados com sucesso."
      );
    } catch (error) {
      console.error(
        "Falha ao registrar eventos de ciclo de vida da conferência:",
        error
      );
    }
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
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summaryData),
      });
      logConferenceLifecycleEvents(summaryData);
      toast.success("CONFERÊNCIA ENVIADA COM SUCESSO", { id: "global-toast" });
      router.push("/inicio");
    } catch (error) {
      console.error("Erro ao concluir conferência:", error);
      toast.error("Não foi possível salvar a conferência.", {
        id: "global-toast",
      });
    } finally {
      setIsSummaryModalOpen(false);
    }
  };

  const handleNumericInputChange =
    (setter: React.Dispatch<React.SetStateAction<number>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^\d*$/.test(value)) {
        setter(Number(value));
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
          disabled={isLoading || step !== "selection"}
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

      {step === "scanning" && (
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

          {maintenanceDevices.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-bold text-amber-800 flex items-center">
                <Wrench className="mr-2" />
                EM MANUTENÇÃO ({maintenanceDevices.length})
              </h3>
              <p className="text-xs text-slate-500 mb-2">
                Estes itens não precisam ser escaneados.
              </p>
              <ul className="h-24 overflow-y-auto mt-2 space-y-1 pr-2">
                {maintenanceDevices.map((device) => (
                  <li
                    key={device}
                    className="p-2 bg-amber-50 text-amber-800 rounded font-mono text-sm"
                  >
                    {device}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
            <button
              onClick={handleRestart}
              className="flex items-center bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <RefreshCcw size={20} className="mr-2" /> REINICIAR
            </button>
            <button
              onClick={handleProceedToPeripherals}
              className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              PRÓXIMO <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        </>
      )}

      {step === "peripherals" && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <h3 className="font-bold text-lg text-gray-800 text-center">
            3. Informe a Quantidade de Periféricos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {expectedPeripherals.includes("mouse") && (
              <div className="relative">
                <label
                  htmlFor="mice"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mouses
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none pt-6">
                  <Mouse className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="mice"
                  value={miceCount}
                  onChange={handleNumericInputChange(setMiceCount)}
                  min="0"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
            {expectedPeripherals.includes("carregador") && (
              <div className="relative">
                <label
                  htmlFor="chargers"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Carregadores
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none pt-6">
                  <Power className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="chargers"
                  value={chargersCount}
                  onChange={handleNumericInputChange(setChargersCount)}
                  min="0"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
            {expectedPeripherals.includes("fone") && (
              <div className="relative">
                <label
                  htmlFor="headsets"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fones de Ouvido
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none pt-6">
                  <Headphones className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="headsets"
                  value={headsetsCount}
                  onChange={handleNumericInputChange(setHeadsetsCount)}
                  min="0"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={handleFinalizeConference}
              className="flex items-center bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors"
            >
              FINALIZAR CONFERÊNCIA <CheckCircle size={20} className="ml-2" />
            </button>
          </div>
        </div>
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

            {(summaryData.miceCount !== undefined ||
              summaryData.chargersCount !== undefined ||
              summaryData.headsetsCount !== undefined) && <hr />}
            <div className="grid grid-cols-2 gap-x-4">
              {summaryData.miceCount !== undefined && (
                <p>
                  <span className="font-semibold">Mouses:</span>{" "}
                  {summaryData.miceCount}
                </p>
              )}
              {summaryData.chargersCount !== undefined && (
                <p>
                  <span className="font-semibold">Carregadores:</span>{" "}
                  {summaryData.chargersCount}
                </p>
              )}
              {summaryData.headsetsCount !== undefined && (
                <p>
                  <span className="font-semibold">Fones:</span>{" "}
                  {summaryData.headsetsCount}
                </p>
              )}
            </div>
            <hr />

            <p>
              <span className="font-semibold">
                Total de Dispositivos (Ativos):
              </span>{" "}
              {summaryData.expectedCount}
            </p>
            <p>
              <span className="font-semibold text-green-600">Escaneados:</span>{" "}
              {summaryData.scannedCount}
            </p>
            <p>
              <span className="font-semibold text-red-600">
                Não Escaneados (Faltantes):
              </span>{" "}
              {summaryData.missingCount}
            </p>
            {summaryData.maintenanceCount &&
              summaryData.maintenanceCount > 0 && (
                <p>
                  <span className="font-semibold text-amber-600">
                    Em Manutenção:
                  </span>{" "}
                  {summaryData.maintenanceCount}
                </p>
              )}
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
            {summaryData.maintenanceCount &&
              summaryData.maintenanceCount > 0 && (
                <div>
                  <h4 className="font-semibold mt-2">
                    Dispositivos em Manutenção:
                  </h4>
                  <ul className="text-xs h-24 overflow-y-auto bg-slate-100 p-2 rounded-md mt-1 font-mono">
                    {summaryData.maintenanceDevices?.map((device: string) => (
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
