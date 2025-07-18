// app/(admin)/projetos/page.tsx
"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Plus, Edit, Trash2 } from "lucide-react";
import { SketchPicker, ColorResult } from "react-color";

// Tipagem para um objeto de Projeto
interface Project {
  id: string;
  name: string;
  color: string;
}

// Dados estáticos (mock)
const mockProjects: Project[] = [
  { id: "proj1", name: "Projeto Alpha", color: "#4A90E2" },
  { id: "proj2", name: "Projeto Beta", color: "#F5A623" },
  { id: "proj3", name: "Projeto Gamma", color: "#50E3C2" },
];

export default function ProjectsPage() {
  // A função 'setProjects' foi removida para corrigir o aviso.
  const [projects] = useState<Project[]>(mockProjects);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Estado para o formulário
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState("#FFFFFF");

  // Estado para o modal de exclusão
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleColorChange = (color: ColorResult) => {
    setProjectColor(color.hex);
  };

  const openAddModal = () => {
    setCurrentProject(null);
    setProjectName("");
    setProjectColor("#4A90E2"); // Cor padrão
    setIsFormModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setCurrentProject(project);
    setProjectName(project.name);
    setProjectColor(project.color);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setCurrentProject(null);
    setProjectToDelete(null);
  };

  const handleSave = () => {
    // Lógica para salvar (adicionar ou editar) será implementada com Firebase
    if (currentProject) {
      // Editar
      console.log(
        "Editando projeto:",
        currentProject.id,
        projectName,
        projectColor
      );
    } else {
      // Adicionar
      console.log("Adicionando projeto:", projectName, projectColor);
    }
    closeModals();
    // Aqui, futuramente, atualizaremos a lista de projetos do Firebase
  };

  const handleDelete = () => {
    // Lógica para deletar será implementada com Firebase
    if (projectToDelete) {
      console.log("Deletando projeto:", projectToDelete.id);
    }
    closeModals();
    // Aqui, futuramente, atualizaremos a lista de projetos do Firebase
  };

  const modalTitle = currentProject
    ? "Editar Projeto"
    : "Adicionar Novo Projeto";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Projetos</h1>
        <button
          onClick={openAddModal}
          className="mt-4 sm:mt-0 flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          <span className="hidden sm:inline">Adicionar Projeto</span>
          <span className="sm:hidden">Projeto</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <ul className="space-y-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100"
            >
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-4"
                  style={{ backgroundColor: project.color }}
                ></div>
                <span className="font-semibold text-gray-700">
                  {project.name}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => openEditModal(project)}
                  className="text-gray-500 hover:text-indigo-600"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => openDeleteModal(project)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal de Adicionar/Editar Projeto */}
      <Modal isOpen={isFormModalOpen} onClose={closeModals} title={modalTitle}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-medium text-gray-700"
            >
              Nome do Projeto
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cor de Associação
            </label>
            <div className="mt-2">
              <SketchPicker
                color={projectColor}
                onChangeComplete={handleColorChange}
              />
            </div>
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
        message={`Tem certeza que deseja excluir o projeto "${projectToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
