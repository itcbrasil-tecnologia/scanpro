"use client";

import React, { useState } from "react";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { Modal } from "@/components/ui/Modal";
import { Users, BriefcaseBusiness, Truck, Laptop } from "lucide-react";

type ModalListItem = string | { name: string; whatsapp?: string };

const mockTechnicians: ModalListItem[] = [
  { name: "João Marcos", whatsapp: "(61) 99999-0001" },
  { name: "José Frederico", whatsapp: "(61) 99999-0002" },
  { name: "Lucas Andrade", whatsapp: "(61) 99999-0003" },
];

const mockProjects: ModalListItem[] = [
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

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    data: [] as ModalListItem[],
  });

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Técnicos Cadastrados"
          value={7}
          icon={Users}
          onDetailsClick={() =>
            openModal("Técnicos Cadastrados", mockTechnicians)
          }
        />
        <DashboardCard
          title="Projetos"
          value={4}
          icon={BriefcaseBusiness}
          onDetailsClick={() => openModal("Projetos", mockProjects)}
        />
        <DashboardCard title="UMs" value={12} icon={Truck} />
        <DashboardCard
          title="Notebooks Cadastrados"
          value={153}
          icon={Laptop}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Últimas Conferências
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="p-3 text-sm font-semibold text-slate-600">
                  Data
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600">
                  Horários
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600">
                  Projeto
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600">
                  Técnico
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 text-center">
                  Contagem
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 text-center">
                  Status
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 text-center">
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody>
              {mockConferences.map((conference, index) => (
                <tr key={index} className="border-b hover:bg-slate-50">
                  <td className="p-3">{conference.date}</td>
                  <td className="p-3">
                    {conference.startTime} - {conference.endTime}
                  </td>
                  <td className="p-3">
                    {conference.project} ({conference.um})
                  </td>
                  <td className="p-3">{conference.technician}</td>
                  <td className="p-3 text-center">
                    {conference.scanned} / {conference.expected}
                  </td>
                  <td className="p-3 text-center">
                    {renderStatus(conference.scanned, conference.expected)}
                  </td>
                  <td className="p-3 text-center">
                    {conference.missing > 0 && (
                      <button
                        className="text-scanpro-teal hover:underline text-sm font-medium"
                        onClick={() =>
                          openModal(
                            "Dispositivos Não Escaneados",
                            conference.missingHostnames
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
        <div className="flex justify-end items-center mt-4 text-sm">
          <span>Itens por página: 7</span>
          <div className="ml-4">
            <button className="px-3 py-1 border rounded-md hover:bg-slate-100">
              Anterior
            </button>
            <button className="px-3 py-1 border rounded-md hover:bg-slate-100 ml-2">
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
