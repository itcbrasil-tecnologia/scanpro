"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Plus, Edit, Trash2 } from "lucide-react";
import { SketchPicker, ColorResult } from "react-color";
import toast from "react-hot-toast";

// Tipagem para um objeto de Projeto, agora com 'id' opcional
interface Project {
  id: string;
  name: string;
  color: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState("#FFFFFF");

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Função para carregar os projetos do Firestore
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const projectsCollection = collection(db, "projects");
      const projectSnapshot = await getDocs(projectsCollection);
      const projectsList = projectSnapshot.docs.map((document) => ({
        id: document.id,
        name: document.data().name,
        color: document.data().color,
      }));
      setProjects(projectsList);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      toast.error("Não foi possível carregar os projetos.");
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega os projetos quando o componente é montado
  useEffect(() => {
    fetchProjects();
  }, []);

  const handleColorChange = (color: ColorResult) => {
    setProjectColor(color.hex);
  };

  const openAddModal = () => {
    setCurrentProject(null);
    setProjectName("");
    setProjectColor("#4A90E2");
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

  const handleSave = async () => {
    if (!projectName) {
      toast.error("O nome do projeto é obrigatório.");
      return;
    }

    const projectData = { name: projectName, color: projectColor };

    try {
      if (currentProject) {
        // Editar projeto existente
        const projectRef = doc(db, "projects", currentProject.id);
        await setDoc(projectRef, projectData);
        toast.success(`Projeto "${projectName}" atualizado com sucesso!`);
      } else {
        // Adicionar novo projeto
        const projectsCollection = collection(db, "projects");
        await addDoc(projectsCollection, projectData);
        toast.success(`Projeto "${projectName}" adicionado com sucesso!`);
      }
      fetchProjects(); // Recarrega a lista de projetos
      closeModals();
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      toast.error("Ocorreu um erro ao salvar o projeto.");
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;

    try {
      // Lógica de verificação (não pode haver UMs associadas) virá aqui
      // Por enquanto, apenas deletamos
      const projectRef = doc(db, "projects", projectToDelete.id);
      await deleteDoc(projectRef);
      toast.success(`Projeto "${projectToDelete.name}" excluído com sucesso!`);
      fetchProjects(); // Recarrega a lista
      closeModals();
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      toast.error("Ocorreu um erro ao excluir o projeto.");
    }
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
          className="mt-4 sm:mt-0 flex items-center justify-center bg-scanpro-teal text-white px-4 py-2 rounded-lg shadow hover:bg-opacity-90 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          <span className="hidden sm:inline">Adicionar Projeto</span>
          <span className="sm:hidden">Projeto</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        {isLoading ? (
          <p className="text-center text-gray-500">Carregando projetos...</p>
        ) : (
          <ul className="space-y-3">
            {projects.length > 0 ? (
              projects.map((project) => (
                <li
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-md hover:bg-slate-100"
                >
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-4 border border-slate-300"
                      style={{ backgroundColor: project.color }}
                    ></div>
                    <span className="font-semibold text-gray-700">
                      {project.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => openEditModal(project)}
                      className="text-gray-500 hover:text-scanpro-teal"
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
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                Nenhum projeto cadastrado.
              </p>
            )}
          </ul>
        )}
      </div>

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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-scanpro-teal focus:border-scanpro-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cor de Associação
            </label>
            <div className="mt-2 flex justify-center">
              <SketchPicker
                color={projectColor}
                onChangeComplete={handleColorChange}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="bg-scanpro-teal text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
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
        message={`Tem certeza que deseja excluir o projeto "${projectToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
