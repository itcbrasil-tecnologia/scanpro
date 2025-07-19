"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { BookCheck, Camera } from "lucide-react";

// --- Interfaces e Dados Estáticos (Mock) ---
interface Conference {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  um: string;
  expected: number;
  scanned: number;
  missing: number;
  missingHostnames: string[];
}

const mockUserConferences: Conference[] = [
  {
    id: "conf1",
    date: "2025-07-18",
    startTime: "08:05",
    endTime: "08:15",
    um: "BSBIA01",
    expected: 105,
    scanned: 105,
    missing: 0,
    missingHostnames: [],
  },
  {
    id: "conf2",
    date: "2025-07-17",
    startTime: "17:30",
    endTime: "17:42",
    um: "SPV01",
    expected: 12,
    scanned: 10,
    missing: 2,
    missingHostnames: ["SPV01-ADV", "SPV01-REC02"],
  },
];

export default function InicioPage() {
  const { userProfile } = useAuth();
  const [conferences] = useState<Conference[]>(mockUserConferences);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string[]>([]);

  const dailyCounts = { completed: 1, total: 2 };

  const openDetailsModal = (hostnames: string[]) => {
    setModalContent(hostnames);
    setIsModalOpen(true);
  };

  const renderStatus = (conference: Conference) => {
    const isComplete = conference.scanned === conference.expected;
    const style = isComplete
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";

    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full ${style}`}>
        CONCLUÍDO
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Bem-vindo, {userProfile?.nome?.split(" ")[0]}!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <h3 className="font-bold text-gray-700">
              Contagens Diárias Disponíveis
            </h3>
            <div className="flex justify-center items-center my-2">
              <BookCheck className="w-10 h-10 text-scanpro-teal" />
              <p className="text-4xl font-bold text-gray-800 ml-4">
                {dailyCounts.total - dailyCounts.completed}/{dailyCounts.total}
              </p>
            </div>
          </div>

          <div className="sm:hidden">
            <Link href="/scanner" passHref>
              <div className="w-full flex items-center justify-center bg-scanpro-teal text-white px-4 py-3 rounded-lg shadow-lg hover:bg-opacity-90 transition-colors font-bold text-lg">
                <Camera size={24} className="mr-3" />
                INICIAR CONFERÊNCIA
              </div>
            </Link>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Suas Últimas Conferências
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              {/* MUDANÇA APLICADA AQUI */}
              <thead className="bg-slate-200 border-b-2 border-slate-300">
                <tr>
                  <th className="p-3 text-sm font-semibold text-slate-600">
                    Data
                  </th>
                  <th className="p-3 text-sm font-semibold text-slate-600">
                    UM
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
                {conferences.map((conference) => (
                  <tr
                    key={conference.id}
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="p-3 text-sm">
                      <p>
                        {new Date(conference.date).toLocaleDateString("pt-BR", {
                          timeZone: "UTC",
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conference.startTime} - {conference.endTime}
                      </p>
                    </td>
                    <td className="p-3 text-sm font-medium">{conference.um}</td>
                    <td className="p-3 text-sm text-center">
                      {conference.scanned} / {conference.expected}
                    </td>
                    <td className="p-3 text-center">
                      {renderStatus(conference)}
                    </td>
                    <td className="p-3 text-center">
                      {conference.missing > 0 && (
                        <button
                          onClick={() =>
                            openDetailsModal(conference.missingHostnames)
                          }
                          className="text-scanpro-teal hover:underline text-sm font-medium"
                        >
                          Ver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dispositivos Não Escaneados"
      >
        <ul className="space-y-2">
          {modalContent.map((hostname, index) => (
            <li
              key={index}
              className="bg-gray-100 p-2 rounded-md text-gray-700 font-mono"
            >
              {hostname}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
