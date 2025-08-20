"use client";

import React, { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { useAuth } from "@/context/AuthContext";
import { db as firestoreDB } from "@/lib/firebase/config";
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
  orderBy,
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
  ChevronDown,
  Wifi,
  WifiOff,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { db as dexieDB } from "@/lib/dexie/db";
import { ConferenceData } from "@/types";
import { Listbox, Transition, Disclosure } from "@headlessui/react";
import { NumberInput } from "@/components/ui/NumberInput";
import { AppButton } from "@/components/ui/AppButton";

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

const AVAILABLE_PERIPHERALS = ["mouse", "carregador", "fone"];

const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
};

export default function ScannerPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [ums, setUms] = useState<UM[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUmId, setSelectedUmId] = useState<string>("");
  const [isOnline, setIsOnline] = useState(true);
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
  const [summaryData, setSummaryData] = useState<ConferenceData | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const umsSnapshot = await getDocs(
          query(collection(firestoreDB, "ums"), orderBy("name"))
        );
        const umsList = umsSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as UM)
        );
        setUms(umsList);

        const projectsSnapshot = await getDocs(
          collection(firestoreDB, "projects")
        );
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
          collection(firestoreDB, "notebooks"),
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

  const handleFinalizeConference = async () => {
    const endTimeValue = new Date();
    const selectedUM = ums.find((um) => um.id === selectedUmId);
    const selectedProject = projects.find(
      (project) => project.id === selectedUM?.projectId
    );

    const data: ConferenceData = {
      userName: userProfile?.nome,
      projectName: selectedProject?.name || "N/A",
      umName: selectedUM?.name,
      userId: userProfile?.uid,
      conferenceStartTime: conferenceStartTime!,
      startTime: Timestamp.fromDate(conferenceStartTime!),
      endTime: Timestamp.fromDate(endTimeValue),
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

    if ("geolocation" in navigator) {
      try {
        toast.loading("Obtendo localização...", { id: "location-toast" });
        const position = await getCurrentPosition();
        data.latitude = position.coords.latitude;
        data.longitude = position.coords.longitude;
        toast.dismiss("location-toast");
      } catch (error) {
        console.warn("Não foi possível obter a geolocalização:", error);
        toast.dismiss("location-toast");
        toast.error(
          "Não foi possível obter a localização. A conferência será salva sem ela.",
          { duration: 4000 }
        );
      }
    }
    setSummaryData(data);
    setIsSummaryModalOpen(true);
  };

  const logConferenceLifecycleEvents = async (data: ConferenceData) => {
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
            collection(firestoreDB, "notebooks"),
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

      const batch = writeBatch(firestoreDB);
      const timestamp = Timestamp.now();
      const user = userProfile?.nome || "Sistema";
      const details = `Na conferência da UM: ${data.umName}`;

      data.scannedDevices.forEach((hostname: string) => {
        const notebookId = hostnameToIdMap.get(hostname);
        if (notebookId) {
          const eventRef = doc(
            collection(firestoreDB, "notebooks", notebookId, "lifecycleEvents")
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
            collection(firestoreDB, "notebooks", notebookId, "lifecycleEvents")
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

  const saveConferenceOffline = async (data: ConferenceData) => {
    try {
      await dexieDB.conferencesOutbox.add({
        conferenceData: data,
        timestamp: new Date(),
      });

      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((sw) => {
          sw.sync.register("sync-conferences");
        });
      }
      toast.success(
        "Conexão indisponível. Sua conferência foi salva localmente e será enviada depois.",
        { duration: 5000 }
      );
      router.push("/inicio");
    } catch (error) {
      console.error("Falha ao salvar conferência no IndexedDB:", error);
      toast.error("Não foi possível salvar a conferência localmente.");
    }
  };

  const handleConcludeAndSend = async () => {
    if (!summaryData) return;
    setIsSummaryModalOpen(false);

    if (!navigator.onLine) {
      await saveConferenceOffline(summaryData);
      return;
    }

    try {
      await addDoc(collection(firestoreDB, "conferences"), {
        ...summaryData,
      });

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summaryData),
      });

      logConferenceLifecycleEvents(summaryData);

      toast.success("CONFERÊNCIA ENVIADA COM SUCESSO", {
        id: "global-toast",
      });
      router.push("/inicio");
    } catch (error) {
      console.error(
        "Erro ao concluir conferência online, salvando localmente:",
        error
      );
      await saveConferenceOffline(summaryData);
    }
  };

  const getUmName = (id: string) =>
    ums.find((u) => u.id === id)?.name ||
    (isLoading ? "Carregando..." : "-- Selecione para iniciar");

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700">
            1. Selecione a Unidade Móvel (UM)
          </label>
          <Listbox
            value={selectedUmId}
            onChange={setSelectedUmId}
            disabled={isLoading || step !== "selection"}
          >
            <div className="relative mt-1">
              <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm disabled:bg-slate-50 disabled:cursor-not-allowed">
                <span className="block truncate">
                  {getUmName(selectedUmId)}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                  {ums.map((um) => (
                    <Listbox.Option
                      key={um.id}
                      value={um.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? "bg-teal-100 text-teal-900" : "text-gray-900"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {um.name}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
        <div
          className={`flex items-center text-xs font-bold px-3 py-1 rounded-full ml-4 flex-shrink-0 ${
            isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isOnline ? (
            <Wifi size={14} className="mr-2" />
          ) : (
            <WifiOff size={14} className="mr-2" />
          )}
          {isOnline ? "Online" : "Offline"}
        </div>
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
              {maintenanceDevices.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <Disclosure>
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="w-full flex justify-between items-center text-left text-amber-800">
                          <div className="flex items-center font-semibold text-sm">
                            <Wrench size={14} className="mr-2" />
                            {maintenanceDevices.length} dispositivo(s) em
                            manutenção
                          </div>
                          <ChevronDown
                            size={20}
                            className={`transition-transform ${
                              open ? "rotate-180" : ""
                            }`}
                          />
                        </Disclosure.Button>
                        <Disclosure.Panel className="mt-2 pl-2">
                          <p className="text-xs text-slate-500 mb-2">
                            Estes itens não precisam ser escaneados.
                          </p>
                          <ul className="h-24 overflow-y-auto bg-slate-50 p-2 rounded-md space-y-1 font-mono text-sm">
                            {maintenanceDevices.map((device) => (
                              <li key={device}>{device}</li>
                            ))}
                          </ul>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                </div>
              )}
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
            <AppButton
              onClick={handleRestart}
              size="md"
              className="bg-orange-500 text-white hover:bg-orange-600 data-[disabled]:bg-orange-400"
            >
              <RefreshCcw size={20} className="mr-2" /> REINICIAR
            </AppButton>
            <AppButton
              onClick={handleProceedToPeripherals}
              size="md"
              className="bg-blue-600 text-white hover:bg-blue-700 data-[disabled]:bg-blue-400"
            >
              PRÓXIMO <ArrowRight size={20} className="ml-2" />
            </AppButton>
          </div>
        </>
      )}

      {step === "peripherals" && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-8">
          <h3 className="font-bold text-lg text-gray-800 text-center">
            3. Informe a Quantidade de Periféricos
          </h3>
          <div className="grid grid-cols-1 gap-8">
            {expectedPeripherals.includes("mouse") && (
              <div className="flex flex-col items-center">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Mouse className="h-5 w-5 mr-2 text-slate-500" /> Mouses
                </label>
                <NumberInput value={miceCount} onChange={setMiceCount} />
              </div>
            )}
            {expectedPeripherals.includes("carregador") && (
              <div className="flex flex-col items-center">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Power className="h-5 w-5 mr-2 text-slate-500" /> Carregadores
                </label>
                <NumberInput
                  value={chargersCount}
                  onChange={setChargersCount}
                />
              </div>
            )}
            {expectedPeripherals.includes("fone") && (
              <div className="flex flex-col items-center">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Headphones className="h-5 w-5 mr-2 text-slate-500" /> Fones
                  de Ouvido
                </label>
                <NumberInput
                  value={headsetsCount}
                  onChange={setHeadsetsCount}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <AppButton
              onClick={handleFinalizeConference}
              variant="primary"
              size="lg"
            >
              FINALIZAR CONFERÊNCIA <CheckCircle size={20} className="ml-2" />
            </AppButton>
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
              <span className="font-semibold">Data:</span>{" "}
              {summaryData.endTime.toDate().toLocaleDateString("pt-BR")}
            </p>
            <p>
              <span className="font-semibold">Horário:</span>{" "}
              {summaryData.startTime.toDate().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              às{" "}
              {summaryData.endTime.toDate().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
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
              summaryData.maintenanceCount > 0 &&
              summaryData.maintenanceDevices && (
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
              <AppButton
                onClick={handleConcludeAndSend}
                variant="primary"
                size="lg"
                className="w-full"
              >
                CONCLUIR E ENVIAR <ArrowRight size={20} className="ml-2" />
              </AppButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
