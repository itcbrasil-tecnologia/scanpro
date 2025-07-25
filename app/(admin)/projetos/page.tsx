"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { SketchPicker, ColorResult } from "react-color";
import toast from "react-hot-toast";

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

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const projectsCollection = collection(db, "projects");
      const projectSnapshot = await getDocs(projectsCollection);
      const projectsList = projectSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            name: doc.data().name,
            color: doc.data().color,
          } as Project)
      );
      setProjects(projectsList);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      toast.error("Não foi possível carregar os projetos.", {
        id: "global-toast",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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
      toast.error("O nome do projeto é obrigatório.", { id: "global-toast" });
      return;
    }
    const projectData = { name: projectName, color: projectColor };
    try {
      if (currentProject) {
        const projectRef = doc(db, "projects", currentProject.id);
        await setDoc(projectRef, projectData);
        toast.success(`Projeto "${projectName}" atualizado com sucesso!`, {
          id: "global-toast",
        });
      } else {
        const projectsCollection = collection(db, "projects");
        await addDoc(projectsCollection, projectData);
        toast.success(`Projeto "${projectName}" adicionado com sucesso!`, {
          id: "global-toast",
        });
      }
      fetchProjects();
      closeModals();
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      toast.error("Ocorreu um erro ao salvar o projeto.", {
        id: "global-toast",
      });
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;

    try {
      // VERIFICAÇÃO DE DEPENDÊNCIA
      const umsQuery = query(
        collection(db, "ums"),
        where("projectId", "==", projectToDelete.id),
        limit(1)
      );
      const umsSnapshot = await getDocs(umsQuery);

      if (!umsSnapshot.empty) {
        toast.error(
          "Não é possível excluir. Existem UMs associadas a este projeto.",
          { id: "global-toast" }
        );
        closeModals();
        return;
      }

      // EXCLUSÃO
      const projectRef = doc(db, "projects", projectToDelete.id);
      await deleteDoc(projectRef);
      toast.success(`Projeto "${projectToDelete.name}" excluído com sucesso!`, {
        id: "global-toast",
      });
      fetchProjects();
      closeModals();
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      toast.error("Ocorreu um erro ao excluir o projeto.", {
        id: "global-toast",
      });
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
          className="mt-4 sm:mt-0 flex items-center justify-center bg-teal-600 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition-colors"
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
                      className="text-gray-500 hover:text-teal-600"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
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
        message={`Tem certeza que deseja excluir o projeto "${projectToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
