"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Plus, Edit, Trash2, ChevronDown } from "lucide-react";
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
  expectedNotebooks: number;
  expectedPeripherals?: string[];
}

const AVAILABLE_PERIPHERALS = ["mouse", "carregador", "fone"];
const PERIPHERAL_LABELS: { [key: string]: string } = {
  mouse: "Mouse",
  carregador: "Carregador",
  fone: "Fone de Ouvido",
};

function UMListItem({
  um,
  project,
  onEdit,
  onDelete,
}: {
  um: UM;
  project?: Project;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  return (
    <div className="bg-slate-50 rounded-md">
      <div className="hidden sm:grid grid-cols-4 gap-4 items-center p-3">
        <div className="col-span-1 flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-4 flex-shrink-0"
            style={{ backgroundColor: project?.color }}
          ></div>
          <span className="font-semibold text-gray-700">{um.name}</span>
        </div>
        <div className="col-span-1 text-slate-600">{project?.name}</div>
        <div className="col-span-1 text-center text-slate-600">
          {um.expectedNotebooks}
        </div>
        <div className="col-span-1 flex items-center justify-end space-x-3">
          <button
            onClick={onEdit}
            className="text-gray-500 hover:text-teal-600"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={onDelete}
            className="text-gray-500 hover:text-red-600"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      <div className="sm:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-full flex items-center justify-between p-3 text-left"
        >
          <div>
            <span className="font-semibold text-gray-800">{um.name}</span>
            <p className="text-sm text-gray-500">{project?.name}</p>
          </div>
          <ChevronDown
            size={20}
            className={`transition-transform ${
              isMobileOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {isMobileOpen && (
          <div className="p-4 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600">
                Notebooks Esperados:
              </span>
              <span className="font-semibold">{um.expectedNotebooks}</span>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={onEdit}
                className="flex items-center text-sm p-2 rounded-md bg-slate-200 hover:bg-slate-300"
              >
                <Edit size={16} className="mr-1" /> Editar
              </button>
              <button
                onClick={onDelete}
                className="flex items-center text-sm p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200"
              >
                <Trash2 size={16} className="mr-1" /> Excluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UMsPage() {
  const [ums, setUms] = useState<UM[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUm, setCurrentUm] = useState<UM | null>(null);
  const [umToDelete, setUmToDelete] = useState<UM | null>(null);

  const [formState, setFormState] = useState({
    name: "",
    projectId: "",
    expectedNotebooks: 0,
    peripherals: AVAILABLE_PERIPHERALS.reduce(
      (acc, curr) => ({ ...acc, [curr]: true }),
      {} as Record<string, boolean>
    ),
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const projectsCollection = collection(db, "projects");
      const projectSnapshot = await getDocs(projectsCollection);
      const projectsList = projectSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Project)
      );
      setProjects(projectsList);

      const umsCollection = collection(db, "ums");
      const umSnapshot = await getDocs(umsCollection);
      const umsList = umSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as UM)
      );
      setUms(umsList);
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

  const groupedUms = useMemo(() => {
    return projects
      .map((project) => ({
        ...project,
        ums: ums.filter((um) => um.projectId === project.id),
      }))
      .filter((project) => project.ums.length > 0);
  }, [projects, ums]);

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      const { checked } = event.target as HTMLInputElement;
      setFormState((prevState) => ({
        ...prevState,
        peripherals: {
          ...prevState.peripherals,
          [name]: checked,
        },
      }));
    } else {
      setFormState((prevState) => ({ ...prevState, [name]: value }));
    }
  };

  const openAddModal = () => {
    setCurrentUm(null);
    setFormState({
      name: "",
      projectId: projects[0]?.id || "",
      expectedNotebooks: 0,
      peripherals: AVAILABLE_PERIPHERALS.reduce(
        (acc, curr) => ({ ...acc, [curr]: true }),
        {} as Record<string, boolean>
      ),
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (um: UM) => {
    setCurrentUm(um);
    setFormState({
      name: um.name,
      projectId: um.projectId,
      expectedNotebooks: um.expectedNotebooks,
      peripherals: AVAILABLE_PERIPHERALS.reduce(
        (acc, curr) => ({
          ...acc,
          [curr]: um.expectedPeripherals?.includes(curr) ?? true,
        }),
        {} as Record<string, boolean>
      ),
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (um: UM) => {
    setUmToDelete(um);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
  };

  const handleSave = async () => {
    if (!formState.name || !formState.projectId) {
      toast.error("Nome da UM e Projeto são obrigatórios.", {
        id: "global-toast",
      });
      return;
    }

    const expectedPeripherals = Object.entries(formState.peripherals)
      .filter(([, isChecked]) => isChecked)
      .map(([peripheralName]) => peripheralName);

    const umData = {
      name: formState.name,
      projectId: formState.projectId,
      expectedNotebooks: Number(formState.expectedNotebooks) || 0,
      expectedPeripherals,
    };

    try {
      if (currentUm) {
        const umRef = doc(db, "ums", currentUm.id);
        await setDoc(umRef, umData);
        toast.success(`UM "${umData.name}" atualizada com sucesso!`, {
          id: "global-toast",
        });
      } else {
        const umsCollection = collection(db, "ums");
        await addDoc(umsCollection, umData);
        toast.success(`UM "${umData.name}" adicionada com sucesso!`, {
          id: "global-toast",
        });
      }
      fetchData();
      closeModals();
    } catch (error) {
      console.error("Erro ao salvar UM:", error);
      toast.error("Ocorreu um erro ao salvar a UM.", { id: "global-toast" });
    }
  };

  const handleDelete = async () => {
    if (!umToDelete) return;
    try {
      const notebooksQuery = query(
        collection(db, "notebooks"),
        where("umId", "==", umToDelete.id),
        limit(1)
      );
      const notebooksSnapshot = await getDocs(notebooksQuery);
      if (!notebooksSnapshot.empty) {
        toast.error(
          "Não é possível excluir. Existem notebooks associados a esta UM.",
          { id: "global-toast" }
        );
        closeModals();
        return;
      }
      const umRef = doc(db, "ums", umToDelete.id);
      await deleteDoc(umRef);
      toast.success(`UM "${umToDelete.name}" excluída com sucesso!`, {
        id: "global-toast",
      });
      fetchData();
      closeModals();
    } catch (error) {
      console.error("Erro ao excluir UM:", error);
      toast.error("Ocorreu um erro ao excluir a UM.", { id: "global-toast" });
    }
  };

  const modalTitle = currentUm ? "Editar UM" : "Adicionar Nova UM";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar UMs</h1>
        <button
          onClick={openAddModal}
          className="mt-4 sm:mt-0 flex items-center justify-center bg-teal-600 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          <span className="hidden sm:inline">Adicionar UM</span>
          <span className="sm:hidden">UM</span>
        </button>
      </div>
      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Carregando dados...</p>
      ) : (
        <div className="space-y-6">
          {groupedUms.map((project) => (
            <div key={project.id} className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                <div
                  className="w-5 h-5 rounded-full mr-3"
                  style={{ backgroundColor: project.color || "#ccc" }}
                ></div>
                {project.name}
              </h2>
              <div className="hidden sm:grid grid-cols-4 gap-4 p-3 text-sm font-semibold text-slate-500 border-b">
                <div className="col-span-1">Nome da UM</div>
                <div className="col-span-1">Projeto</div>
                <div className="col-span-1 text-center">
                  Notebooks Esperados
                </div>
                <div className="col-span-1 text-right">Ações</div>
              </div>
              <div className="space-y-2 mt-2">
                {project.ums.map((um: UM) => (
                  <UMListItem
                    key={um.id}
                    um={um}
                    project={projects.find((p) => p.id === um.projectId)}
                    onEdit={() => openEditModal(um)}
                    onDelete={() => openDeleteModal(um)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={isFormModalOpen} onClose={closeModals} title={modalTitle}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Nome da UM
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formState.name}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="projectId"
              className="block text-sm font-medium text-gray-700"
            >
              Projeto
            </label>
            <select
              id="projectId"
              name="projectId"
              value={formState.projectId}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="expectedNotebooks"
              className="block text-sm font-medium text-gray-700"
            >
              Quantidade de Notebooks Esperados
            </label>
            <input
              type="number"
              id="expectedNotebooks"
              name="expectedNotebooks"
              value={formState.expectedNotebooks}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Periféricos Esperados
            </label>
            <div className="mt-2 space-y-2 sm:space-y-0 sm:flex sm:space-x-6">
              {AVAILABLE_PERIPHERALS.map((peripheral) => (
                <div key={peripheral} className="flex items-center">
                  <input
                    id={peripheral}
                    name={peripheral}
                    type="checkbox"
                    checked={formState.peripherals[peripheral]}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-teal-600 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={peripheral}
                    className="ml-2 block text-sm text-gray-900"
                  >
                    {PERIPHERAL_LABELS[peripheral]}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a UM "${umToDelete?.name}"? Esta ação é irreversível.`}
        confirmButtonText="Confirmar Exclusão"
        confirmButtonVariant="danger"
      />
    </div>
  );
}
