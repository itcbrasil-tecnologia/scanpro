"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import Papa from "papaparse";

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
  return (
    <li className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-md">
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
          className="text-gray-600 font-mono text-sm truncate"
          title={notebook.hostname}
        >
          {notebook.hostname}
        </span>
      </div>
      <div className="flex items-center space-x-3 flex-shrink-0">
        <button
          onClick={onViewHistory}
          className="text-gray-400 hover:text-blue-600"
          title="Ver Histórico do Ativo"
        >
          <History size={16} />
        </button>
        <button
          onClick={onToggleMaintenance}
          className={`text-gray-400 hover:text-amber-600`}
          title={
            isMaintenance ? "Retornar da Manutenção" : "Enviar para Manutenção"
          }
        >
          <Wrench size={16} />
        </button>
        <button
          onClick={onViewQrCode}
          className="text-gray-400 hover:text-teal-600"
          title="Gerar QR Code"
        >
          <QrCode size={16} />
        </button>
        <button
          onClick={onEdit}
          className="text-gray-400 hover:text-teal-600"
          title="Editar"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-600"
          title="Excluir"
        >
          <Trash2 size={16} />
        </button>
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
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
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

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const isUpperCase = name === "hostname" || name === "prefix";
    setFormState((prev) => ({
      ...prev,
      [name]: isUpperCase ? value.toUpperCase() : value,
    }));
  };

  const handleBatchFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const isNumeric = name === "startNumber" || name === "endNumber";
    setBatchFormState((prev) => ({
      ...prev,
      [name]: isNumeric
        ? Number(value)
        : name === "prefix"
        ? value.toUpperCase()
        : value,
    }));
  };

  const handleDownloadTemplate = () => {
    const csvContent = "hostname,serialNumber,assetTag\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
      complete: (results) => {
        const requiredHeaders = ["hostname", "serialNumber", "assetTag"];
        const actualHeaders = results.meta.fields || [];
        const hasAllHeaders = requiredHeaders.every((h) =>
          actualHeaders.includes(h)
        );
        if (!hasAllHeaders) {
          toast.error(
            "O arquivo CSV não contém os cabeçalhos esperados: hostname, serialNumber, assetTag.",
            { id: "global-toast", duration: 5000 }
          );
          return;
        }
        setParsedCsvData(results.data as CsvData[]);
        toast.success("Arquivo processado. Verifique a pré-visualização.");
      },
      error: (error) => {
        toast.error("Ocorreu um erro ao processar o arquivo.", {
          id: "global-toast",
        });
        console.error("Erro PapaParse:", error);
      },
    });
  };

  const handleSaveCsvImport = async () => {
    if (parsedCsvData.length === 0) {
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

  const toggleDropdown = (id: string) => {
    setOpenItems((prevState) => ({ ...prevState, [id]: !prevState[id] }));
  };

  const handleViewSingleQrCode = (hostname: string) => {
    setHostnamesForQrModal([hostname]);
    setIsQrModalOpen(true);
  };

  const handleViewBatchQrCodes = (umNotebooks: Notebook[]) => {
    const names = umNotebooks.map((n) => n.hostname).sort();
    setHostnamesForQrModal(names);
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
      umId: formState.selectedUmId,
      serialNumber: formState.serialNumber,
      assetTag: formState.assetTag,
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
      const numberString = i < 10 ? String(i).padStart(2, "0") : String(i);
      names.push(`${batchFormState.prefix}${numberString}`);
    }
    setGeneratedNames(names);
  };

  const handleSaveBatch = async () => {
    if (generatedNames.length === 0 || !batchFormState.batchSelectedUmId) {
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
        `${generatedNames.length} notebooks adicionados com sucesso! Agora você pode gerar os QR Codes na lista abaixo.`,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Gerenciar Notebooks
        </h1>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition-colors"
          >
            <FileUp size={20} className="mr-2" />
            <span className="hidden sm:inline">Importar CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center bg-teal-600 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition-colors"
          >
            <Sheet size={20} className="mr-2" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
          >
            <Layers size={20} className="mr-2" />
            <span className="hidden sm:inline">Adicionar em Lote</span>
          </button>
        </div>
      </div>
      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Carregando dados...</p>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id}>
              <button
                onClick={() => toggleDropdown(project.id)}
                className="w-full flex items-center p-3 bg-white rounded-lg shadow-md text-left"
                style={{ borderColor: project.color, borderLeftWidth: "4px" }}
              >
                <ChevronDown
                  size={20}
                  className={`mr-3 transition-transform ${
                    openItems[project.id] ? "rotate-180" : ""
                  }`}
                />
                <span className="text-xl font-bold text-gray-800">
                  {project.name}
                </span>
              </button>
              {openItems[project.id] && (
                <div className="pl-4 mt-2 space-y-2">
                  {ums
                    .filter((um) => um.projectId === project.id)
                    .map((um) => {
                      const umNotebooks = notebooks.filter(
                        (n) => n.umId === um.id
                      );
                      return (
                        <div key={um.id}>
                          <button
                            onClick={() => toggleDropdown(um.id)}
                            className="w-full flex items-center p-3 bg-slate-50 rounded-lg text-left hover:bg-slate-100 text-gray-700"
                          >
                            <ChevronDown
                              size={18}
                              className={`mr-2 transition-transform ${
                                openItems[um.id] ? "rotate-180" : ""
                              }`}
                            />
                            <span className="font-semibold">{um.name}</span>
                          </button>
                          {openItems[um.id] && (
                            <div className="pl-6 py-2">
                              {umNotebooks.length > 0 ? (
                                <>
                                  <div className="flex items-center space-x-4 mb-3 ml-2">
                                    <button
                                      onClick={() =>
                                        handleViewBatchQrCodes(umNotebooks)
                                      }
                                      className="flex items-center text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-md"
                                    >
                                      <Printer size={16} className="mr-1.5" />
                                      Gerar QR Codes
                                    </button>
                                    <button
                                      onClick={() => openDeleteBatchModal(um)}
                                      className="flex items-center text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md"
                                    >
                                      <Trash2 size={16} className="mr-1.5" />
                                      Excluir Todos
                                    </button>
                                  </div>
                                  <ul className="space-y-1 bg-white p-3 rounded-md">
                                    {umNotebooks
                                      .sort((a, b) =>
                                        a.hostname.localeCompare(b.hostname)
                                      )
                                      .map((notebook) => (
                                        <NotebookListItem
                                          key={notebook.id}
                                          notebook={notebook}
                                          onEdit={() => openEditModal(notebook)}
                                          onDelete={() =>
                                            openDeleteSingleModal(notebook)
                                          }
                                          onViewQrCode={() =>
                                            handleViewSingleQrCode(
                                              notebook.hostname
                                            )
                                          }
                                          onToggleMaintenance={() =>
                                            openMaintenanceModal(notebook)
                                          }
                                          onViewHistory={() =>
                                            openHistoryModal(notebook)
                                          }
                                        />
                                      ))}
                                  </ul>
                                </>
                              ) : (
                                <p className="text-sm text-gray-500 italic px-3 py-2">
                                  Nenhum notebook cadastrado nesta UM.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formModalTitle}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="hostname"
              className="block text-sm font-medium text-gray-700"
            >
              Hostname
            </label>
            <input
              type="text"
              id="hostname"
              name="hostname"
              value={formState.hostname}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="serialNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Número de Série (SN)
            </label>
            <input
              type="text"
              id="serialNumber"
              name="serialNumber"
              value={formState.serialNumber}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="assetTag"
              className="block text-sm font-medium text-gray-700"
            >
              Patrimônio
            </label>
            <input
              type="text"
              id="assetTag"
              name="assetTag"
              value={formState.assetTag}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="selectedUmId"
              className="block text-sm font-medium text-gray-700"
            >
              Unidade Móvel (UM)
            </label>
            <select
              id="selectedUmId"
              name="selectedUmId"
              value={formState.selectedUmId}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              {ums.map((um) => (
                <option key={um.id} value={um.id}>
                  {um.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveSingle}
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Adicionar Notebooks em Lote"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="batchSelectedUmId"
              className="block text-sm font-medium text-gray-700"
            >
              Unidade Móvel (UM)
            </label>
            <select
              id="batchSelectedUmId"
              name="batchSelectedUmId"
              value={batchFormState.batchSelectedUmId}
              onChange={handleBatchFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              {ums.map((um) => (
                <option key={um.id} value={um.id}>
                  {um.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="prefix"
              className="block text-sm font-medium text-gray-700"
            >
              Prefixo do Hostname
            </label>
            <input
              type="text"
              id="prefix"
              name="prefix"
              placeholder="Ex: BSBIA01-EST"
              value={batchFormState.prefix}
              onChange={handleBatchFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label
                htmlFor="startNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Número Inicial
              </label>
              <input
                type="number"
                id="startNumber"
                name="startNumber"
                value={batchFormState.startNumber}
                onChange={handleBatchFormChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="endNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Número Final
              </label>
              <input
                type="number"
                id="endNumber"
                name="endNumber"
                value={batchFormState.endNumber}
                onChange={handleBatchFormChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <button
              onClick={handleGenerateBatchNames}
              className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700"
            >
              Gerar Pré-visualização
            </button>
          </div>
          {generatedNames.length > 0 && (
            <div className="pt-4 space-y-3">
              <h4 className="font-semibold">
                Notebooks a serem criados ({generatedNames.length}):
              </h4>
              <div className="h-32 overflow-y-auto bg-slate-100 p-2 rounded-md font-mono text-sm">
                {generatedNames.join("\n")}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveBatch}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
                >
                  Salvar Lote
                </button>
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
          <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
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
          <button
            onClick={handleDownloadTemplate}
            className="text-sm font-medium text-teal-600 hover:underline"
          >
            Baixar modelo de planilha (.csv)
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="importUmId"
                className="block text-sm font-medium text-gray-700"
              >
                UM de Destino
              </label>
              <select
                id="importUmId"
                name="importUmId"
                value={importUmId}
                onChange={(e) => setImportUmId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                {ums.map((um) => (
                  <option key={um.id} value={um.id}>
                    {um.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="csvFile"
                className="block text-sm font-medium text-gray-700"
              >
                Arquivo CSV
              </label>
              <input
                type="file"
                id="csvFile"
                name="csvFile"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <button
              onClick={handlePreviewCsv}
              className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 w-full"
            >
              Carregar e Pré-visualizar
            </button>
          </div>
          {parsedCsvData.length > 0 && (
            <div className="pt-4 space-y-3">
              <h4 className="font-semibold">
                Pré-visualização ({parsedCsvData.length} itens):
              </h4>
              <div className="h-40 overflow-y-auto bg-slate-50 p-1 rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-200">
                    <tr>
                      <th className="p-2">hostname</th>
                      <th className="p-2">serialNumber</th>
                      <th className="p-2">assetTag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedCsvData.map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-mono">{row.hostname}</td>
                        <td className="p-2 font-mono">{row.serialNumber}</td>
                        <td className="p-2 font-mono">{row.assetTag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveCsvImport}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Confirmar e Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
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
