// app/(admin)/notebooks/page.tsx
"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Trash2, ChevronDown, Sheet, Layers } from "lucide-react";

// --- Interfaces de Dados ---
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

// --- Dados Estáticos (Mock) ---
const mockProjects: Project[] = [
  { id: "proj1", name: "Projeto Alpha", color: "#4A90E2" },
  { id: "proj2", name: "Projeto Beta", color: "#F5A623" },
];
const mockUms: UM[] = [
  { id: "um1", name: "BSBIA01", projectId: "proj1" },
  { id: "um2", name: "BSBIA02", projectId: "proj1" },
  { id: "um3", name: "SPV01", projectId: "proj2" },
];
const mockNotebooks: Notebook[] = [
  { id: "nb1", hostname: "BSBIA01-EST01", umId: "um1" },
  { id: "nb2", hostname: "BSBIA01-EST02", umId: "um1" },
  { id: "nb3", hostname: "SPV01-ADV", umId: "um3" },
];
// --- Fim dos Dados Estáticos ---

export default function NotebooksPage() {
  const [projects] = useState<Project[]>(mockProjects);
  const [ums] = useState<UM[]>(mockUms);
  const [notebooks] = useState<Notebook[]>(mockNotebooks);

  // Controle de Modais
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Controle dos dropdowns da lista
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Formulário de Adição Individual
  const [hostname, setHostname] = useState("");
  const [selectedUmId, setSelectedUmId] = useState(mockUms[0]?.id || "");

  // Formulário de Adição em Lote
  const [prefix, setPrefix] = useState("");
  const [startNumber, setStartNumber] = useState(1);
  const [endNumber, setEndNumber] = useState(1);
  const [batchSelectedUmId, setBatchSelectedUmId] = useState(
    mockUms[0]?.id || ""
  );
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);

  const [umToDelete, setUmToDelete] = useState<UM | null>(null);

  const toggleDropdown = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerateBatchNames = () => {
    if (endNumber < startNumber) {
      alert("O número final não pode ser menor que o inicial.");
      return;
    }
    const names = [];
    for (let i = startNumber; i <= endNumber; i++) {
      // Regra de negócio: números de 1 a 9 com zero à esquerda
      const numberString = i < 10 ? String(i).padStart(2, "0") : String(i);
      names.push(`${prefix}${numberString}`);
    }
    setGeneratedNames(names);
  };

  const handleSaveBatch = () => {
    // Lógica para salvar notebooks em lote no Firebase
    console.log(
      `Salvando ${generatedNames.length} notebooks para a UM ${batchSelectedUmId}:`,
      generatedNames
    );
    setIsBatchModalOpen(false);
    setGeneratedNames([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Gerenciar Notebooks
        </h1>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => setIsSingleModalOpen(true)}
            className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors"
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

      {/* Listagem Hierárquica */}
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id}>
            <button
              onClick={() => toggleDropdown(project.id)}
              className="w-full flex items-center p-3 bg-white rounded-lg shadow-md text-left"
            >
              <ChevronDown
                size={20}
                className={`mr-3 transition-transform ${
                  openItems[project.id] ? "rotate-180" : ""
                }`}
                style={{ color: project.color }}
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
                      (nb) => nb.umId === um.id
                    );
                    return (
                      <div key={um.id}>
                        <button
                          onClick={() => toggleDropdown(um.id)}
                          className="w-full flex items-center p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100"
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
                                    setUmToDelete(um);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="flex items-center text-sm text-red-600 hover:text-red-800 mb-3 ml-2"
                                >
                                  <Trash2 size={16} className="mr-1" />
                                  Excluir em Lote
                                </button>
                                <ul className="space-y-1 list-disc list-inside bg-white p-3 rounded-md">
                                  {umNotebooks
                                    .sort((a, b) =>
                                      a.hostname.localeCompare(b.hostname)
                                    )
                                    .map((nb) => (
                                      <li
                                        key={nb.id}
                                        className="text-gray-600 font-mono text-sm"
                                      >
                                        {nb.hostname}
                                      </li>
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

      {/* Modal de Adição Individual */}
      <Modal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        title="Adicionar Notebook"
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
              onChange={(e) => setHostname(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="um"
              className="block text-sm font-medium text-gray-700"
            >
              Unidade Móvel (UM)
            </label>
            <select
              id="um"
              value={selectedUmId}
              onChange={(e) => setSelectedUmId(e.target.value)}
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
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Adição em Lote */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Adicionar Notebooks em Lote"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="batch-um"
              className="block text-sm font-medium text-gray-700"
            >
              Unidade Móvel (UM)
            </label>
            <select
              id="batch-um"
              value={batchSelectedUmId}
              onChange={(e) => setBatchSelectedUmId(e.target.value)}
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
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
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
                onChange={(e) => setStartNumber(Number(e.target.value))}
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
                onChange={(e) => setEndNumber(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <button
              onClick={handleGenerateBatchNames}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Gerar Pré-visualização
            </button>
          </div>
          {generatedNames.length > 0 && (
            <div className="pt-4 space-y-3">
              <h4 className="font-semibold">
                Notebooks a serem criados ({generatedNames.length}):
              </h4>
              <div className="h-32 overflow-y-auto bg-gray-100 p-2 rounded-md font-mono text-sm">
                {generatedNames.join("\n")}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveBatch}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Salvar Lote
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Exclusão em Lote */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          console.log("Confirmou exclusão");
          setIsDeleteModalOpen(false);
        }}
        title="Confirmar Exclusão em Lote"
        message={`Tem certeza que deseja excluir TODOS os notebooks da UM "${umToDelete?.name}"?`}
      />
    </div>
  );
}
