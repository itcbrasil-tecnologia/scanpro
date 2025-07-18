// app/(admin)/dashboard/page.tsx
"use client";

import React, { useState } from "react";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { Modal } from "@/components/ui/Modal";
import { Users, Building, Laptop } from "lucide-react";

// Dados estáticos para a interface (serão substituídos por dados do Firebase)
const summaryData = {
  technicians: 7,
  projects: 4,
  ums: 12,
  notebooks: 153,
};

const mockTechnicians = [
  { name: "João Marcos", whatsapp: "(61) 99999-0001" },
  { name: "José Frederico", whatsapp: "(61) 99999-0002" },
  { name: "Lucas Andrade", whatsapp: "(61) 99999-0003" },
];

const mockProjects = [
  { name: "Projeto Alpha" },
  { name: "Projeto Beta" },
  { name: "Projeto Gamma" },
];

const mockConferences = [
  {
    date: "17/07/2025",
    startTime: "08:05",
    endTime: "08:15",
    project: "Projeto Alpha",
    um: "BSBIA01",
    technician: "João Marcos",
    expected: 105,
    scanned: 105,
    missing: 0,
    missingHostnames: [],
  },
  {
    date: "17/07/2025",
    startTime: "17:30",
    endTime: "17:42",
    project: "Projeto Beta",
    um: "SPV01",
    technician: "Lucas Andrade",
    expected: 12,
    scanned: 10,
    missing: 2,
    missingHostnames: ["SPV01-ADV", "SPV01-REC02"],
  },
];

// 1. TIPO ESPECÍFICO PARA OS ITENS DO MODAL, SUBSTITUINDO O 'any'
type ModalListItem = string | { name: string; whatsapp?: string };

export default function DashboardPage() {
  // 2. ATUALIZAÇÃO DO ESTADO PARA USAR O NOVO TIPO
  const [modalContent, setModalContent] = useState<{
    title: string;
    data: ModalListItem[];
  }>({ title: "", data: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 3. ATUALIZAÇÃO DA FUNÇÃO PARA USAR O NOVO TIPO
  const openModal = (title: string, data: ModalListItem[]) => {
    setModalContent({ title, data });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const renderStatus = (scanned: number, expected: number) => {
    const isCompleted = scanned === expected;
    const bgColor = isCompleted
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
    return (
      <span
        className={`px-3 py-1 text-sm font-semibold rounded-full ${bgColor}`}
      >
        Concluído
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      {/* Seção de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Técnicos Cadastrados"
          value={summaryData.technicians}
          icon={Users}
          onDetailsClick={() =>
            openModal("Técnicos Cadastrados", mockTechnicians)
          }
        />
        <DashboardCard
          title="Projetos"
          value={summaryData.projects}
          icon={Building}
          onDetailsClick={() => openModal("Projetos", mockProjects)}
        />
        <DashboardCard title="UMs" value={summaryData.ums} icon={Building} />
        <DashboardCard
          title="Notebooks Cadastrados"
          value={summaryData.notebooks}
          icon={Laptop}
        />
      </div>

      {/* Seção da Tabela */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Últimas Conferências
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Data
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Horários
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Projeto
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Técnico
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">
                  Contagem
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">
                  Status
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody>
              {mockConferences.map((conf, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3">{conf.date}</td>
                  <td className="p-3">
                    {conf.startTime} - {conf.endTime}
                  </td>
                  <td className="p-3">
                    {conf.project} ({conf.um})
                  </td>
                  <td className="p-3">{conf.technician}</td>
                  <td className="p-3 text-center">
                    {conf.scanned} / {conf.expected}
                  </td>
                  <td className="p-3 text-center">
                    {renderStatus(conf.scanned, conf.expected)}
                  </td>
                  <td className="p-3 text-center">
                    {conf.missing > 0 && (
                      <button
                        className="text-indigo-600 hover:underline text-sm font-medium"
                        onClick={() =>
                          openModal(
                            "Dispositivos Não Escaneados",
                            conf.missingHostnames
                          )
                        }
                      >
                        Ver Faltantes
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Lógica de Paginação será adicionada aqui */}
        <div className="flex justify-end items-center mt-4 text-sm">
          <span>Itens por página: 7</span>
          <div className="ml-4">
            <button className="px-3 py-1 border rounded-md hover:bg-gray-100">
              Anterior
            </button>
            <button className="px-3 py-1 border rounded-md hover:bg-gray-100 ml-2">
              Próximo
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalContent.title}
      >
        <ul className="space-y-2">
          {/* 4. LÓGICA DE RENDERIZAÇÃO ATUALIZADA PARA LIDAR COM O NOVO TIPO */}
          {modalContent.data.map((item, index) => (
            <li
              key={index}
              className="bg-gray-100 p-2 rounded-md text-gray-700"
            >
              {typeof item === "string"
                ? item
                : `${item.name} ${item.whatsapp ? `- ${item.whatsapp}` : ""}`}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
