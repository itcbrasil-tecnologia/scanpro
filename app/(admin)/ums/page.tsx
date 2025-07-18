// app/(admin)/ums/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Plus, Edit, Trash2, ChevronDown } from "lucide-react";

// Interfaces para os dados
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
}

// --- Dados Estáticos (Mock) ---
// Usaremos os projetos para popular o <select> no formulário
const mockProjects: Project[] = [
  { id: "proj1", name: "Projeto Alpha", color: "#4A90E2" },
  { id: "proj2", name: "Projeto Beta", color: "#F5A623" },
  { id: "proj3", name: "Projeto Gamma", color: "#50E3C2" },
];

const mockUms: UM[] = [
  { id: "um1", name: "BSBIA01", projectId: "proj1", expectedNotebooks: 105 },
  { id: "um2", name: "BSBIA02", projectId: "proj1", expectedNotebooks: 105 },
  { id: "um3", name: "SPV01", projectId: "proj2", expectedNotebooks: 12 },
  { id: "um4", name: "SPV02", projectId: "proj2", expectedNotebooks: 12 },
];
// --- Fim dos Dados Estáticos ---

// Componente para o item da lista, que se adapta ao mobile
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
    <div className="bg-gray-50 rounded-md">
      {/* Visão Desktop: Tabela */}
      <div className="hidden sm:flex items-center justify-between p-3">
        <div className="flex items-center flex-1">
          <div
            className="w-4 h-4 rounded-full mr-4"
            style={{ backgroundColor: project?.color }}
          ></div>
          <span className="font-semibold text-gray-700">{um.name}</span>
        </div>
        <div className="flex-1">{project?.name}</div>
        <div className="flex-1 text-center">{um.expectedNotebooks}</div>
        <div className="flex items-center justify-end space-x-3 flex-1">
          <button
            onClick={onEdit}
            className="text-gray-500 hover:text-indigo-600"
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

      {/* Visão Mobile: Dropdown [cite: 46] */}
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
          <div className="p-3 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600">
                Notebooks Esperados:
              </span>
              <span className="font-semibold">{um.expectedNotebooks}</span>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={onEdit}
                className="flex items-center text-sm p-2 rounded-md bg-gray-200 hover:bg-gray-300"
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
  const [ums] = useState<UM[]>(mockUms);
  const [projects] = useState<Project[]>(mockProjects);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [currentUm, setCurrentUm] = useState<UM | null>(null);
  const [umToDelete, setUmToDelete] = useState<UM | null>(null);

  // Estado do formulário
  const [umName, setUmName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [expectedNotebooks, setExpectedNotebooks] = useState(0);

  // Agrupa as UMs por projeto [cite: 24, 45]
  const groupedUms = useMemo(() => {
    return projects
      .map((project) => ({
        ...project,
        ums: ums.filter((um) => um.projectId === project.id),
      }))
      .filter((project) => project.ums.length > 0);
  }, [projects, ums]);

  const openAddModal = () => {
    setCurrentUm(null);
    setUmName("");
    setSelectedProjectId(projects[0]?.id || "");
    setExpectedNotebooks(0);
    setIsFormModalOpen(true);
  };

  const openEditModal = (um: UM) => {
    setCurrentUm(um);
    setUmName(um.name);
    setSelectedProjectId(um.projectId);
    setExpectedNotebooks(um.expectedNotebooks);
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

  const handleSave = () => {
    // Lógica de salvar será implementada com Firebase
    closeModals();
  };

  const handleDelete = () => {
    // Lógica de deletar será implementada com Firebase [cite: 25, 48, 49]
    closeModals();
  };

  const modalTitle = currentUm ? "Editar UM" : "Adicionar Nova UM";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar UMs</h1>
        <button
          onClick={openAddModal}
          className="mt-4 sm:mt-0 flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          <span className="hidden sm:inline">Adicionar UM</span>
          <span className="sm:hidden">UM</span>
        </button>
      </div>

      <div className="space-y-6">
        {groupedUms.map((project) => (
          <div key={project.id} className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
              <div
                className="w-5 h-5 rounded-full mr-3"
                style={{ backgroundColor: project.color }}
              ></div>
              {project.name}
            </h2>
            {/* Cabeçalho da Tabela - Apenas Desktop */}
            <div className="hidden sm:flex items-center justify-between p-3 text-sm font-semibold text-gray-500 border-b">
              <div className="flex-1">Nome da UM</div>
              <div className="flex-1">Projeto</div>
              <div className="flex-1 text-center">Notebooks Esperados</div>
              <div className="flex-1 text-right">Ações</div>
            </div>
            <div className="space-y-2 mt-2">
              {project.ums.map((um) => (
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

      {/* Modal de Adicionar/Editar UM */}
      <Modal isOpen={isFormModalOpen} onClose={closeModals} title={modalTitle}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="umName"
              className="block text-sm font-medium text-gray-700"
            >
              Nome da UM
            </label>
            <input
              type="text"
              id="umName"
              value={umName}
              onChange={(e) => setUmName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="project"
              className="block text-sm font-medium text-gray-700"
            >
              Projeto
            </label>
            <select
              id="project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
              value={expectedNotebooks}
              onChange={(e) => setExpectedNotebooks(Number(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação para Excluir */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a UM "${umToDelete?.name}"? Esta ação é irreversível.`}
      />
    </div>
  );
}
