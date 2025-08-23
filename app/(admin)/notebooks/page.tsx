"use client";

import React, { useState, useEffect, useCallback, Fragment } from "react";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  writeBatch,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { QrCodePrintModal } from "@/components/ui/QrCodePrintModal";
import { AssetLifecycleModal } from "@/components/ui/AssetLifecycleModal";
import { useAuth } from "@/context/AuthContext";
import {
  Disclosure,
  Transition,
  Listbox,
  Field,
  Label,
  Input,
} from "@headlessui/react";
import {
  Layers,
  Sheet,
  Trash2,
  ChevronDown,
  Edit,
  QrCode,
  Printer,
  Wrench,
  CircleDot,
  FileUp,
  History,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import toast from "react-hot-toast";
import Papa from "papaparse";
import { NumberInput } from "@/components/ui/NumberInput";
import { AppButton } from "@/components/ui/AppButton";

interface Project {
  id: string;
  name: string;
  color: string;
}

interface UM {
  id: string;
  name: string;
  projectId: string;
}

interface Notebook {
  id: string;
  hostname: string;
  umId: string;
  serialNumber?: string;
  assetTag?: string;
  status?: "Ativo" | "Em Manutenção";
  maintenanceStartDate?: Timestamp;
}

interface CsvData {
  hostname: string;
  serialNumber: string;
  assetTag: string;
}

function NotebookListItem({
  notebook,
  onEdit,
  onDelete,
  onViewQrCode,
  onToggleMaintenance,
  onViewHistory,
}: {
  notebook: Notebook;
  onEdit: () => void;
  onDelete: () => void;
  onViewQrCode: () => void;
  onToggleMaintenance: () => void;
  onViewHistory: () => void;
}) {
  const isMaintenance = notebook.status === "Em Manutenção";
  const actionButtonClasses =
    "bg-slate-100 data-[hover]:bg-slate-200 dark:bg-zinc-700/50 dark:data-[hover]:bg-zinc-700";

  const actionButtons = (
    <div className="flex items-center space-x-2 flex-shrink-0">
      <AppButton
        onClick={onViewHistory}
        variant="ghost"
        size="icon"
        title="Ver Histórico do Ativo"
        className={`${actionButtonClasses} data-[hover]:text-blue-600`}
      >
        <History size={16} />
      </AppButton>
      <AppButton
        onClick={onToggleMaintenance}
        variant="ghost"
        size="icon"
        title={
          isMaintenance ? "Retornar da Manutenção" : "Enviar para Manutenção"
        }
        className={`${actionButtonClasses} data-[hover]:text-amber-600`}
      >
        <Wrench size={16} />
      </AppButton>
      <AppButton
        onClick={onViewQrCode}
        variant="ghost"
        size="icon"
        title="Gerar QR Code"
        className={`${actionButtonClasses} data-[hover]:text-teal-800`}
      >
        <QrCode size={16} />
      </AppButton>
      <AppButton
        onClick={onEdit}
        variant="ghost"
        size="icon"
        title="Editar"
        className={`${actionButtonClasses} data-[hover]:text-teal-600`}
      >
        <Edit size={16} />
      </AppButton>
      <AppButton
        onClick={onDelete}
        variant="ghost"
        size="icon"
        title="Excluir"
        className={`${actionButtonClasses} data-[hover]:text-red-600`}
      >
        <Trash2 size={16} />
      </AppButton>
    </div>
  );

  return (
    <li className="bg-white p-2 rounded-md border border-slate-200 dark:bg-zinc-800/50 dark:border-zinc-700">
      {/* Layout para Desktop (visivel a partir de sm: 640px) */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center min-w-0">
          <span title={`Status: ${notebook.status || "Ativo"}`}>
            <CircleDot
              size={16}
              className={`mr-3 flex-shrink-0 ${
                isMaintenance ? "text-amber-500" : "text-green-500"
              }`}
            />
          </span>
          <span
            className="text-gray-600 font-mono text-sm truncate dark:text-zinc-300"
            title={notebook.hostname}
          >
            {notebook.hostname}
          </span>
        </div>
        {actionButtons}
      </div>
      {/* Layout para Mobile (escondido a partir de sm: 640px) */}
      <div className="sm:hidden">
        <Disclosure>
          {({ open }) => (
            <div>
              <Disclosure.Button className="w-full flex items-center justify-between text-left py-1">
                <div className="flex items-center min-w-0">
                  <span title={`Status: ${notebook.status || "Ativo"}`}>
                    <CircleDot
                      size={16}
                      className={`mr-3 flex-shrink-0 ${
                        isMaintenance ? "text-amber-500" : "text-green-500"
                      }`}
                    />
                  </span>
                  <span
                    className="text-gray-600 font-mono text-sm truncate dark:text-zinc-300"
                    title={notebook.hostname}
                  >
                    {notebook.hostname}
                  </span>
                </div>
                <ChevronDown
                  size={20}
                  className={`ml-2 transition-transform flex-shrink-0 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </Disclosure.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel className="pt-3 pb-1 mt-2 border-t flex justify-end dark:border-zinc-700">
                  {actionButtons}
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      </div>
    </li>
  );
}

export default function NotebooksPage() {
  const { userProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [ums, setUms] = useState<UM[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isDeleteBatchModalOpen, setIsDeleteBatchModalOpen] = useState(false);
  const [isDeleteSingleModalOpen, setIsDeleteSingleModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLifecycleModalOpen, setIsLifecycleModalOpen] = useState(false);
  const [selectedNotebookForHistory, setSelectedNotebookForHistory] =
    useState<Notebook | null>(null);
  const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(null);
  const [notebookToDelete, setNotebookToDelete] = useState<Notebook | null>(
    null
  );
  const [notebookForMaintenance, setNotebookForMaintenance] =
    useState<Notebook | null>(null);
  const [umToDeleteFrom, setUmToDeleteFrom] = useState<UM | null>(null);
  const [hostnamesForQrModal, setHostnamesForQrModal] = useState<string[]>([]);
  const [parsedCsvData, setParsedCsvData] = useState<CsvData[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importUmId, setImportUmId] = useState<string>("");

  const [formState, setFormState] = useState({
    hostname: "",
    serialNumber: "",
    assetTag: "",
    selectedUmId: "",
  });

  const [batchFormState, setBatchFormState] = useState({
    prefix: "",
    startNumber: 1,
    endNumber: 1,
    batchSelectedUmId: "",
  });
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const projectsSnapshot = await getDocs(collection(db, "projects"));
      const projectsList = projectsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Project)
      );
      setProjects(projectsList);

      const umsSnapshot = await getDocs(collection(db, "ums"));
      const umsList = umsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as UM)
      );
      setUms(umsList);

      if (umsList.length > 0) {
        setFormState((prev) => ({
          ...prev,
          selectedUmId: prev.selectedUmId || umsList[0].id,
        }));
        setBatchFormState((prev) => ({
          ...prev,
          batchSelectedUmId: prev.batchSelectedUmId || umsList[0].id,
        }));
        setImportUmId((prev) => prev || umsList[0].id);
      }

      const notebooksSnapshot = await getDocs(collection(db, "notebooks"));
      const notebooksList = notebooksSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Notebook)
      );
      setNotebooks(notebooksList);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Não foi possível carregar os dados.", {
        id: "global-toast",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const logLifecycleEvent = async (
    notebookId: string,
    eventType: "Criação" | "Manutenção" | "Operacional",
    details: string
  ) => {
    try {
      const eventData = {
        timestamp: Timestamp.now(),
        user: userProfile?.nome || "Sistema",
        eventType,
        details,
      };
      const eventsCollectionRef = collection(
        db,
        "notebooks",
        notebookId,
        "lifecycleEvents"
      );
      await addDoc(eventsCollectionRef, eventData);
    } catch (error) {
      console.error(
        `Erro ao logar evento '${eventType}' para notebook ${notebookId}:`,
        error
      );
    }
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === "hostname" ? value.toUpperCase() : value,
    }));
  };

  const handleFormListboxChange = (value: string) => {
    setFormState((prev) => ({ ...prev, selectedUmId: value }));
  };

  const handleBatchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBatchFormState((prev) => ({
      ...prev,
      [name]: name === "prefix" ? value.toUpperCase() : value,
    }));
  };

  const handleBatchListboxChange = (value: string) => {
    setBatchFormState((prev) => ({ ...prev, batchSelectedUmId: value }));
  };

  const handleBatchNumberInputChange = (
    name: "startNumber" | "endNumber",
    value: number
  ) => {
    setBatchFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownloadTemplate = () => {
    const headers = ["hostname", "serialNumber", "assetTag"];
    const delimiter = ";";
    const csvContent = `${headers.join(delimiter)}\n`;
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_notebooks.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setParsedCsvData([]);
    }
  };

  const handlePreviewCsv = () => {
    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo CSV primeiro.", {
        id: "global-toast",
      });
      return;
    }
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
      complete: (results) => {
        const requiredHeaders = ["hostname", "serialNumber", "assetTag"];
        const actualHeaders = results.meta.fields || [];
        const hasAllHeaders = requiredHeaders.every((h) =>
          actualHeaders.includes(h)
        );
        if (!hasAllHeaders) {
          toast.error(
            "O arquivo CSV não contém os cabeçalhos esperados: hostname;serialNumber;assetTag.",
            { id: "global-toast", duration: 5000 }
          );
          return;
        }
        setParsedCsvData(results.data as CsvData[]);
        toast.success("Arquivo processado. Verifique a pré-visualização.");
      },
      error: (error) => {
        console.error("Erro PapaParse:", error);
        toast.error("Ocorreu um erro ao processar o arquivo.", {
          id: "global-toast",
        });
      },
    });
  };

  const handleSaveCsvImport = async () => {
    if (!parsedCsvData || parsedCsvData.length === 0) {
      toast.error(
        "Não há dados para importar. Carregue um arquivo e pré-visualize.",
        { id: "global-toast" }
      );
      return;
    }
    if (!importUmId) {
      toast.error("Por favor, selecione uma UM de destino.", {
        id: "global-toast",
      });
      return;
    }

    const batch = writeBatch(db);
    const notebooksCollection = collection(db, "notebooks");
    const umName = ums.find((um) => um.id === importUmId)?.name || "N/A";
    const newNotebooksWithIds: { id: string; name: string }[] = [];

    parsedCsvData.forEach((notebook) => {
      if (notebook.hostname) {
        const newNotebookRef = doc(notebooksCollection);
        batch.set(newNotebookRef, {
          hostname: notebook.hostname.toUpperCase(),
          serialNumber: notebook.serialNumber || "",
          assetTag: notebook.assetTag || "",
          umId: importUmId,
          status: "Ativo",
        });
        newNotebooksWithIds.push({
          id: newNotebookRef.id,
          name: notebook.hostname,
        });
      }
    });

    try {
      await batch.commit();
      for (const nb of newNotebooksWithIds) {
        await logLifecycleEvent(
          nb.id,
          "Criação",
          `Ativo importado via CSV para a UM: ${umName}`
        );
      }
      toast.success(
        `${parsedCsvData.length} notebooks importados com sucesso!`,
        { id: "global-toast", duration: 4000 }
      );
      fetchData();
      setIsImportModalOpen(false);
      setParsedCsvData([]);
      setSelectedFile(null);
    } catch (error) {
      console.error("Erro ao salvar importação CSV:", error);
      toast.error("Ocorreu um erro ao salvar os notebooks importados.", {
        id: "global-toast",
      });
    }
  };

  const handleViewSingleQrCode = (hostname: string) => {
    setHostnamesForQrModal([hostname]);
    setIsQrModalOpen(true);
  };

  const handleViewBatchQrCodes = (umNotebooks: Notebook[]) => {
    const names = umNotebooks.map((n) => n.hostname).sort();
    setHostnamesForQrModal(names);
    setIsQrModalOpen(true);
  };

  const openAddModal = () => {
    setCurrentNotebook(null);
    setFormState({
      hostname: "",
      serialNumber: "",
      assetTag: "",
      selectedUmId: ums[0]?.id || "",
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (notebook: Notebook) => {
    setCurrentNotebook(notebook);
    setFormState({
      hostname: notebook.hostname,
      serialNumber: notebook.serialNumber || "",
      assetTag: notebook.assetTag || "",
      selectedUmId: notebook.umId,
    });
    setIsFormModalOpen(true);
  };

  const openDeleteSingleModal = (notebook: Notebook) => {
    setNotebookToDelete(notebook);
    setIsDeleteSingleModalOpen(true);
  };

  const openDeleteBatchModal = (um: UM) => {
    setUmToDeleteFrom(um);
    setIsDeleteBatchModalOpen(true);
  };

  const openMaintenanceModal = (notebook: Notebook) => {
    setNotebookForMaintenance(notebook);
    setIsMaintenanceModalOpen(true);
  };

  const openHistoryModal = (notebook: Notebook) => {
    setSelectedNotebookForHistory(notebook);
    setIsLifecycleModalOpen(true);
  };

  const handleSaveSingle = async () => {
    if (!formState.hostname || !formState.selectedUmId) {
      toast.error("Hostname e UM são obrigatórios.", { id: "global-toast" });
      return;
    }
    const notebookData: Partial<Notebook> = {
      hostname: formState.hostname,
      serialNumber: formState.serialNumber,
      assetTag: formState.assetTag,
      umId: formState.selectedUmId,
    };

    try {
      if (currentNotebook) {
        const notebookRef = doc(db, "notebooks", currentNotebook.id);
        await updateDoc(notebookRef, notebookData);
        toast.success(
          `Notebook "${notebookData.hostname}" atualizado com sucesso!`,
          { id: "global-toast" }
        );
      } else {
        const notebooksCollection = collection(db, "notebooks");
        const newDocRef = await addDoc(notebooksCollection, {
          ...notebookData,
          status: "Ativo",
        });

        const umName =
          ums.find((um) => um.id === formState.selectedUmId)?.name || "N/A";
        await logLifecycleEvent(
          newDocRef.id,
          "Criação",
          `Ativo cadastrado na UM: ${umName}`
        );

        toast.success(
          `Notebook "${formState.hostname}" adicionado com sucesso!`,
          { id: "global-toast" }
        );
      }
      fetchData();
      setIsFormModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar notebook:", error);
      toast.error("Ocorreu um erro ao salvar o notebook.", {
        id: "global-toast",
      });
    }
  };

  const handleDeleteSingle = async () => {
    if (!notebookToDelete) return;
    try {
      await deleteDoc(doc(db, "notebooks", notebookToDelete.id));
      toast.success(
        `Notebook "${notebookToDelete.hostname}" excluído com sucesso!`,
        { id: "global-toast" }
      );
      fetchData();
      setIsDeleteSingleModalOpen(false);
    } catch (error) {
      console.error("Erro ao excluir notebook:", error);
      toast.error("Ocorreu um erro ao excluir o notebook.", {
        id: "global-toast",
      });
    }
  };

  const handleToggleMaintenanceStatus = async () => {
    if (!notebookForMaintenance) return;

    const { id, hostname } = notebookForMaintenance;
    const currentStatus = notebookForMaintenance.status || "Ativo";
    const newStatus = currentStatus === "Ativo" ? "Em Manutenção" : "Ativo";

    try {
      const notebookRef = doc(db, "notebooks", id);
      if (newStatus === "Em Manutenção") {
        await updateDoc(notebookRef, {
          status: newStatus,
          maintenanceStartDate: Timestamp.now(),
        });
      } else {
        await updateDoc(notebookRef, {
          status: newStatus,
          maintenanceStartDate: deleteField(),
        });
      }

      const eventType =
        newStatus === "Em Manutenção" ? "Manutenção" : "Operacional";
      const details =
        newStatus === "Em Manutenção"
          ? "Ativo enviado para manutenção."
          : "Ativo retornou à operação.";
      await logLifecycleEvent(id, eventType, details);

      toast.success(
        `Status do notebook "${hostname}" alterado para ${newStatus}.`,
        { id: "global-toast" }
      );
      fetchData();
      setIsMaintenanceModalOpen(false);
    } catch (error) {
      console.error("Erro ao alterar status de manutenção:", error);
      toast.error("Ocorreu um erro ao alterar o status.", {
        id: "global-toast",
      });
    }
  };

  const handleGenerateBatchNames = () => {
    if (batchFormState.endNumber < batchFormState.startNumber) {
      toast.error("O número final não pode ser menor que o inicial.", {
        id: "global-toast",
      });
      return;
    }
    const names = [];
    for (
      let i = batchFormState.startNumber;
      i <= batchFormState.endNumber;
      i++
    ) {
      const numberString = i < 100 ? String(i).padStart(2, "0") : String(i);
      names.push(`${batchFormState.prefix}${numberString}`);
    }
    setGeneratedNames(names);
  };

  const handleSaveBatch = async () => {
    if (!generatedNames.length || !batchFormState.batchSelectedUmId) {
      toast.error("Gere os nomes e selecione uma UM antes de salvar.", {
        id: "global-toast",
      });
      return;
    }

    try {
      const batch = writeBatch(db);
      const notebooksCollection = collection(db, "notebooks");
      const umName =
        ums.find((um) => um.id === batchFormState.batchSelectedUmId)?.name ||
        "N/A";
      const newNotebooksWithIds: { id: string; name: string }[] = [];

      generatedNames.forEach((name) => {
        const newNotebookRef = doc(notebooksCollection);
        batch.set(newNotebookRef, {
          hostname: name,
          umId: batchFormState.batchSelectedUmId,
          status: "Ativo",
        });
        newNotebooksWithIds.push({ id: newNotebookRef.id, name });
      });

      await batch.commit();

      for (const nb of newNotebooksWithIds) {
        await logLifecycleEvent(
          nb.id,
          "Criação",
          `Ativo cadastrado em lote na UM: ${umName}`
        );
      }

      toast.success(
        `${generatedNames.length} notebooks adicionados com sucesso!`,
        { id: "global-toast", duration: 5000 }
      );
      fetchData();
      setIsBatchModalOpen(false);
      setGeneratedNames([]);
      setBatchFormState((prev) => ({ ...prev, prefix: "" }));
    } catch (error) {
      console.error("Erro ao salvar em lote:", error);
      toast.error("Ocorreu um erro ao salvar os notebooks.", {
        id: "global-toast",
      });
    }
  };

  const handleDeleteBatch = async () => {
    if (!umToDeleteFrom) return;

    try {
      const notebooksQuery = query(
        collection(db, "notebooks"),
        where("umId", "==", umToDeleteFrom.id)
      );
      const snapshot = await getDocs(notebooksQuery);

      if (snapshot.empty) {
        toast.error("Nenhum notebook para excluir nesta UM.", {
          id: "global-toast",
        });
        setIsDeleteBatchModalOpen(false);
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      toast.success(
        `Todos os notebooks da UM "${umToDeleteFrom.name}" foram excluídos.`,
        { id: "global-toast" }
      );
      fetchData();
      setIsDeleteBatchModalOpen(false);
    } catch (error) {
      console.error("Erro ao excluir em lote:", error);
      toast.error("Ocorreu um erro ao excluir os notebooks.", {
        id: "global-toast",
      });
    }
  };

  const formModalTitle = currentNotebook
    ? "Editar Notebook"
    : "Adicionar Notebook";

  const getUmName = (umId: string) =>
    ums.find((um) => um.id === umId)?.name || "Selecione uma UM";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-zinc-100">
          Gerenciar Notebooks
        </h1>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <AppButton
            onClick={() => setIsImportModalOpen(true)}
            variant="success"
          >
            <FileUp size={20} className="mr-2" />
            <span className="hidden sm:inline">Importar CSV</span>
          </AppButton>
          <AppButton onClick={openAddModal}>
            <Sheet size={20} className="mr-2" />
            <span className="hidden sm:inline">Adicionar</span>
          </AppButton>
          <AppButton
            onClick={() => setIsBatchModalOpen(true)}
            variant="ghost"
            className="bg-blue-600 text-white data-[hover]:bg-blue-700"
          >
            <Layers size={20} className="mr-2" />
            <span className="hidden sm:inline">Adicionar em Lote</span>
          </AppButton>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8 dark:text-zinc-400">
          Carregando dados...
        </p>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Disclosure key={project.id} as="div">
              {({ open }) => (
                <>
                  <Disclosure.Button
                    className="w-full flex items-center p-3 bg-white rounded-lg shadow-md text-left dark:bg-zinc-800"
                    style={{
                      borderColor: project.color,
                      borderLeftWidth: "4px",
                    }}
                  >
                    <ChevronDown
                      size={20}
                      className={`mr-3 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                    <span className="text-xl font-bold text-gray-800 dark:text-zinc-100">
                      {project.name}
                    </span>
                  </Disclosure.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 -translate-y-2"
                    enterTo="transform opacity-100 translate-y-0"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 translate-y-0"
                    leaveTo="transform opacity-0 -translate-y-2"
                  >
                    <Disclosure.Panel className="pl-4 mt-2 space-y-2">
                      {ums
                        .filter((um) => um.projectId === project.id)
                        .map((um) => {
                          const umNotebooks = notebooks.filter(
                            (n) => n.umId === um.id
                          );
                          return (
                            <Disclosure key={um.id} as="div">
                              {({ open: umOpen }) => (
                                <>
                                  <Disclosure.Button className="w-full flex items-center p-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-left text-gray-700 dark:bg-zinc-700/80 dark:hover:bg-zinc-700 dark:text-zinc-200">
                                    <ChevronDown
                                      size={18}
                                      className={`mr-2 transition-transform ${
                                        umOpen ? "rotate-180" : ""
                                      }`}
                                    />
                                    <span className="font-semibold">
                                      {um.name}
                                    </span>
                                  </Disclosure.Button>
                                  <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 -translate-y-2"
                                    enterTo="transform opacity-100 translate-y-0"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 translate-y-0"
                                    leaveTo="transform opacity-0 -translate-y-2"
                                  >
                                    <Disclosure.Panel className="pl-6 py-2">
                                      {umNotebooks.length > 0 ? (
                                        <>
                                          <div className="flex items-center space-x-2 mb-3 ml-2">
                                            <AppButton
                                              onClick={() =>
                                                handleViewBatchQrCodes(
                                                  umNotebooks
                                                )
                                              }
                                              size="sm"
                                              className="bg-blue-500 data-[hover]:bg-blue-600"
                                            >
                                              <Printer
                                                size={16}
                                                className="mr-1.5"
                                              />
                                              Gerar QR Codes
                                            </AppButton>
                                            <AppButton
                                              onClick={() =>
                                                openDeleteBatchModal(um)
                                              }
                                              variant="danger"
                                              size="sm"
                                            >
                                              <Trash2
                                                size={16}
                                                className="mr-1.5"
                                              />
                                              Excluir Todos
                                            </AppButton>
                                          </div>
                                          <ul className="space-y-1">
                                            {umNotebooks
                                              .sort((a, b) =>
                                                a.hostname.localeCompare(
                                                  b.hostname
                                                )
                                              )
                                              .map((notebook) => (
                                                <NotebookListItem
                                                  key={notebook.id}
                                                  notebook={notebook}
                                                  onEdit={() =>
                                                    openEditModal(notebook)
                                                  }
                                                  onDelete={() =>
                                                    openDeleteSingleModal(
                                                      notebook
                                                    )
                                                  }
                                                  onViewQrCode={() =>
                                                    handleViewSingleQrCode(
                                                      notebook.hostname
                                                    )
                                                  }
                                                  onToggleMaintenance={() =>
                                                    openMaintenanceModal(
                                                      notebook
                                                    )
                                                  }
                                                  onViewHistory={() =>
                                                    openHistoryModal(notebook)
                                                  }
                                                />
                                              ))}
                                          </ul>
                                        </>
                                      ) : (
                                        <p className="text-sm text-gray-500 italic px-3 py-2 dark:text-zinc-400">
                                          Nenhum notebook cadastrado nesta UM.
                                        </p>
                                      )}
                                    </Disclosure.Panel>
                                  </Transition>
                                </>
                              )}
                            </Disclosure>
                          );
                        })}
                    </Disclosure.Panel>
                  </Transition>
                </>
              )}
            </Disclosure>
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formModalTitle}
      >
        <div className="space-y-4">
          <Field>
            <Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Hostname
            </Label>
            <Input
              name="hostname"
              type="text"
              value={formState.hostname}
              onChange={handleFormInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
            />
          </Field>
          <Field>
            <Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Número de Série (SN)
            </Label>
            <Input
              name="serialNumber"
              type="text"
              value={formState.serialNumber}
              onChange={handleFormInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
            />
          </Field>
          <Field>
            <Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Patrimônio
            </Label>
            <Input
              name="assetTag"
              type="text"
              value={formState.assetTag}
              onChange={handleFormInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
            />
          </Field>
          <Listbox
            value={formState.selectedUmId}
            onChange={handleFormListboxChange}
          >
            <div className="relative">
              <Listbox.Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Unidade Móvel (UM)
              </Listbox.Label>
              <Listbox.Button className="relative mt-1 w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-offset-2 dark:bg-zinc-700 dark:border-zinc-600">
                <span className="block truncate">
                  {getUmName(formState.selectedUmId)}
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
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 z-10 dark:bg-zinc-800 dark:ring-zinc-700">
                  {ums.map((um) => (
                    <Listbox.Option
                      key={um.id}
                      value={um.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active
                            ? "bg-teal-100 text-teal-900 dark:bg-zinc-700"
                            : "text-gray-900 dark:text-zinc-200"
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
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600 dark:text-teal-400">
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
          <div className="flex justify-end pt-2">
            <AppButton onClick={handleSaveSingle}>Salvar</AppButton>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Adicionar Notebooks em Lote"
      >
        <div className="space-y-4">
          <Listbox
            value={batchFormState.batchSelectedUmId}
            onChange={handleBatchListboxChange}
          >
            <div className="relative">
              <Listbox.Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Unidade Móvel (UM)
              </Listbox.Label>
              <Listbox.Button className="relative mt-1 w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-offset-2 dark:bg-zinc-700 dark:border-zinc-600">
                <span className="block truncate">
                  {getUmName(batchFormState.batchSelectedUmId)}
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
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 z-10 dark:bg-zinc-800 dark:ring-zinc-700">
                  {ums.map((um) => (
                    <Listbox.Option
                      key={um.id}
                      value={um.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active
                            ? "bg-teal-100 text-teal-900 dark:bg-zinc-700"
                            : "text-gray-900 dark:text-zinc-200"
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
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600 dark:text-teal-400">
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
          <Field>
            <Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Prefixo do Hostname
            </Label>
            <Input
              name="prefix"
              type="text"
              placeholder="Ex: BSBIA01-EST"
              value={batchFormState.prefix}
              onChange={handleBatchInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
            />
          </Field>
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <Field className="flex-1">
              <Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Número Inicial
              </Label>
              <NumberInput
                value={batchFormState.startNumber}
                onChange={(value) =>
                  handleBatchNumberInputChange("startNumber", value)
                }
              />
            </Field>
            <Field className="flex-1">
              <Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Número Final
              </Label>
              <NumberInput
                value={batchFormState.endNumber}
                onChange={(value) =>
                  handleBatchNumberInputChange("endNumber", value)
                }
              />
            </Field>
          </div>
          <div className="flex justify-center pt-2">
            <AppButton onClick={handleGenerateBatchNames} variant="secondary">
              Gerar Pré-visualização
            </AppButton>
          </div>
          {generatedNames.length > 0 && (
            <div className="pt-4 space-y-3">
              <h4 className="font-semibold dark:text-zinc-200">
                Notebooks a serem criados ({generatedNames.length}):
              </h4>
              <div className="h-32 overflow-y-auto bg-slate-100 p-2 rounded-md font-mono text-sm dark:bg-zinc-900">
                {generatedNames.join("\n")}
              </div>
              <div className="flex justify-end pt-2">
                <AppButton onClick={handleSaveBatch}>Salvar Lote</AppButton>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Importar Notebooks via CSV"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm dark:bg-blue-900/50 dark:text-blue-300">
            <strong>Instruções:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Baixe o modelo CSV para garantir a formatação correta.</li>
              <li>Preencha a planilha com os dados dos notebooks.</li>
              <li>Selecione a UM de destino e o arquivo preenchido.</li>
              <li>
                Clique em &quot;Carregar e Pré-visualizar&quot; e verifique os
                dados.
              </li>
              <li>
                Se tudo estiver correto, clique em &quot;Confirmar e
                Salvar&quot;.
              </li>
            </ol>
          </div>
          <AppButton
            onClick={handleDownloadTemplate}
            variant="ghost"
            className="!text-teal-600 !p-0 data-[hover]:!bg-transparent data-[hover]:underline dark:!text-teal-400"
          >
            Baixar modelo de planilha (.csv)
          </AppButton>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Listbox value={importUmId} onChange={setImportUmId}>
              <div className="relative">
                <Listbox.Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  UM de Destino
                </Listbox.Label>
                <Listbox.Button className="relative mt-1 w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-offset-2 dark:bg-zinc-700 dark:border-zinc-600">
                  <span className="block truncate">
                    {getUmName(importUmId)}
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
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 z-10 dark:bg-zinc-800 dark:ring-zinc-700">
                    {ums.map((um) => (
                      <Listbox.Option
                        key={um.id}
                        value={um.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-teal-100 text-teal-900 dark:bg-zinc-700"
                              : "text-gray-900 dark:text-zinc-200"
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
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600 dark:text-teal-400">
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
            <Field>
              <Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Arquivo CSV
              </Label>
              <div className="mt-1">
                <input
                  type="file"
                  id="csvFile"
                  name="csvFile"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:text-zinc-400 dark:file:bg-teal-900/50 dark:file:text-teal-300 dark:hover:file:bg-teal-800/50"
                />
              </div>
            </Field>
          </div>
          <div className="flex justify-center pt-2">
            <AppButton
              onClick={handlePreviewCsv}
              variant="secondary"
              className="w-full"
            >
              Carregar e Pré-visualizar
            </AppButton>
          </div>
          {parsedCsvData && parsedCsvData.length > 0 && (
            <div className="pt-4 space-y-3">
              <h4 className="font-semibold dark:text-zinc-200">
                Pré-visualização ({parsedCsvData.length} itens):
              </h4>
              <div className="h-40 overflow-y-auto bg-slate-50 p-1 rounded-md border dark:bg-zinc-900 dark:border-zinc-700">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-200 dark:bg-zinc-700">
                    <tr>
                      <th className="p-2">hostname</th>
                      <th className="p-2">serialNumber</th>
                      <th className="p-2">assetTag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedCsvData.map((row, index) => (
                      <tr key={index} className="border-b dark:border-zinc-600">
                        <td className="p-2 font-mono">{row.hostname}</td>
                        <td className="p-2 font-mono">{row.serialNumber}</td>
                        <td className="p-2 font-mono">{row.assetTag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end pt-2">
                <AppButton onClick={handleSaveCsvImport} variant="success">
                  Confirmar e Salvar
                </AppButton>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteSingleModalOpen}
        onClose={() => setIsDeleteSingleModalOpen(false)}
        onConfirm={handleDeleteSingle}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o notebook "${notebookToDelete?.hostname}"?`}
        confirmButtonText="Confirmar Exclusão"
        confirmButtonVariant="danger"
      />

      <ConfirmationModal
        isOpen={isDeleteBatchModalOpen}
        onClose={() => setIsDeleteBatchModalOpen(false)}
        onConfirm={handleDeleteBatch}
        title="Confirmar Exclusão em Lote"
        message={`Tem certeza que deseja excluir TODOS os notebooks da UM "${umToDeleteFrom?.name}"?`}
        confirmButtonText="Confirmar Exclusão"
        confirmButtonVariant="danger"
      />

      <ConfirmationModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onConfirm={handleToggleMaintenanceStatus}
        title="Confirmar Alteração de Status"
        message={`Tem certeza que deseja ${
          notebookForMaintenance?.status === "Em Manutenção"
            ? "retornar o notebook da manutenção"
            : "enviar o notebook para manutenção"
        }: "${notebookForMaintenance?.hostname}"?`}
        confirmButtonText="Confirmar"
        confirmButtonVariant="primary"
      />

      <QrCodePrintModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        hostnames={hostnamesForQrModal}
      />

      <AssetLifecycleModal
        isOpen={isLifecycleModalOpen}
        onClose={() => setIsLifecycleModalOpen(false)}
        notebook={selectedNotebookForHistory}
      />
    </div>
  );
}
