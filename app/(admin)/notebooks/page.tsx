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
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Layers, Sheet, Trash2, ChevronDown, Edit } from "lucide-react";
import toast from "react-hot-toast";

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
}

function NotebookListItem({
  notebook,
  onEdit,
  onDelete,
}: {
  notebook: Notebook;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-md">
      <span className="text-gray-600 font-mono text-sm">
        {notebook.hostname}
      </span>
      <div className="flex items-center space-x-3">
        <button onClick={onEdit} className="text-gray-400 hover:text-teal-600">
          <Edit size={16} />
        </button>
        <button onClick={onDelete} className="text-gray-400 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}

export default function NotebooksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [ums, setUms] = useState<UM[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isDeleteBatchModalOpen, setIsDeleteBatchModalOpen] = useState(false);
  const [isDeleteSingleModalOpen, setIsDeleteSingleModalOpen] = useState(false);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(null);
  const [hostname, setHostname] = useState("");
  const [selectedUmId, setSelectedUmId] = useState("");
  const [prefix, setPrefix] = useState("");
  const [startNumber, setStartNumber] = useState(1);
  const [endNumber, setEndNumber] = useState(1);
  const [batchSelectedUmId, setBatchSelectedUmId] = useState("");
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [umToDeleteFrom, setUmToDeleteFrom] = useState<UM | null>(null);
  const [notebookToDelete, setNotebookToDelete] = useState<Notebook | null>(
    null
  );

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
        setSelectedUmId((current) => current || umsList[0].id);
        setBatchSelectedUmId((current) => current || umsList[0].id);
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

  const toggleDropdown = (id: string) => {
    setOpenItems((previousState) => ({
      ...previousState,
      [id]: !previousState[id],
    }));
  };

  const openAddModal = () => {
    setCurrentNotebook(null);
    setHostname("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (notebook: Notebook) => {
    setCurrentNotebook(notebook);
    setHostname(notebook.hostname);
    setSelectedUmId(notebook.umId);
    setIsFormModalOpen(true);
  };

  const openDeleteSingleModal = (notebook: Notebook) => {
    setNotebookToDelete(notebook);
    setIsDeleteSingleModalOpen(true);
  };

  const handleSaveSingle = async () => {
    if (!hostname || !selectedUmId) {
      toast.error("Hostname e UM são obrigatórios.", { id: "global-toast" });
      return;
    }
    try {
      if (currentNotebook) {
        const notebookRef = doc(db, "notebooks", currentNotebook.id);
        await setDoc(notebookRef, { hostname, umId: selectedUmId });
        toast.success(`Notebook "${hostname}" atualizado com sucesso!`, {
          id: "global-toast",
        });
      } else {
        await addDoc(collection(db, "notebooks"), {
          hostname,
          umId: selectedUmId,
        });
        toast.success(`Notebook "${hostname}" adicionado com sucesso!`, {
          id: "global-toast",
        });
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

  const handleGenerateBatchNames = () => {
    if (endNumber < startNumber) {
      toast.error("O número final não pode ser menor que o inicial.", {
        id: "global-toast",
      });
      return;
    }
    const names = [];
    for (let i = startNumber; i <= endNumber; i++) {
      const numberString = i < 10 ? String(i).padStart(2, "0") : String(i);
      names.push(`${prefix}${numberString}`);
    }
    setGeneratedNames(names);
  };

  const handleSaveBatch = async () => {
    if (generatedNames.length === 0 || !batchSelectedUmId) {
      toast.error("Gere os nomes e selecione uma UM antes de salvar.", {
        id: "global-toast",
      });
      return;
    }
    try {
      const batch = writeBatch(db);
      const notebooksCollection = collection(db, "notebooks");
      generatedNames.forEach((name) => {
        const newNotebookRef = doc(notebooksCollection);
        batch.set(newNotebookRef, { hostname: name, umId: batchSelectedUmId });
      });
      await batch.commit();
      toast.success(
        `${generatedNames.length} notebooks adicionados com sucesso!`,
        { id: "global-toast" }
      );
      fetchData();
      setIsBatchModalOpen(false);
      setGeneratedNames([]);
      setPrefix("");
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
            onClick={openAddModal}
            className="flex items-center justify-center bg-teal-600 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition-colors"
          >
            <Sheet size={20} className="mr-2" />
            <span className="hidden sm:inline">Adicionar Notebook</span>
            <span className="sm:hidden">Notebook</span>
          </button>
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
          >
            <Layers size={20} className="mr-2" />
            <span className="hidden sm:inline">Adicionar em Lote</span>
            <span className="sm:hidden">Em Lote</span>
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
                style={{ color: project.color }}
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
                        (notebook) => notebook.umId === um.id
                      );
                      return (
                        <div key={um.id}>
                          <button
                            onClick={() => toggleDropdown(um.id)}
                            className="w-full flex items-center p-3 bg-slate-50 rounded-lg text-left hover:bg-slate-100"
                          >
                            <ChevronDown
                              size={18}
                              className={`mr-2 transition-transform ${
                                openItems[um.id] ? "rotate-180" : ""
                              }`}
                            />
                            <span className="font-semibold text-gray-700">
                              {um.name}
                            </span>
                          </button>
                          {openItems[um.id] && (
                            <div className="pl-6 py-2">
                              {umNotebooks.length > 0 ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setUmToDeleteFrom(um);
                                      setIsDeleteBatchModalOpen(true);
                                    }}
                                    className="flex items-center text-sm text-red-600 hover:text-red-800 mb-3 ml-2"
                                  >
                                    <Trash2 size={16} className="mr-1" />
                                    Excluir Todos da UM
                                  </button>
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
              value={hostname}
              onChange={(event) =>
                setHostname(event.target.value.toUpperCase())
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="umId"
              className="block text-sm font-medium text-gray-700"
            >
              Unidade Móvel (UM)
            </label>
            <select
              id="umId"
              value={selectedUmId}
              onChange={(event) => setSelectedUmId(event.target.value)}
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
              htmlFor="batchUmId"
              className="block text-sm font-medium text-gray-700"
            >
              Unidade Móvel (UM)
            </label>
            <select
              id="batchUmId"
              value={batchSelectedUmId}
              onChange={(event) => setBatchSelectedUmId(event.target.value)}
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
              placeholder="Ex: BSBIA01-EST"
              value={prefix}
              onChange={(event) => setPrefix(event.target.value.toUpperCase())}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label
                htmlFor="start"
                className="block text-sm font-medium text-gray-700"
              >
                Número Inicial
              </label>
              <input
                type="number"
                id="start"
                value={startNumber}
                onChange={(event) => setStartNumber(Number(event.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="end"
                className="block text-sm font-medium text-gray-700"
              >
                Número Final
              </label>
              <input
                type="number"
                id="end"
                value={endNumber}
                onChange={(event) => setEndNumber(Number(event.target.value))}
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
      <ConfirmationModal
        isOpen={isDeleteBatchModalOpen}
        onClose={() => setIsDeleteBatchModalOpen(false)}
        onConfirm={handleDeleteBatch}
        title="Confirmar Exclusão em Lote"
        message={`Tem certeza que deseja excluir TODOS os notebooks da UM "${umToDeleteFrom?.name}"?`}
      />
      <ConfirmationModal
        isOpen={isDeleteSingleModalOpen}
        onClose={() => setIsDeleteSingleModalOpen(false)}
        onConfirm={handleDeleteSingle}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o notebook "${notebookToDelete?.hostname}"?`}
      />
    </div>
  );
}
