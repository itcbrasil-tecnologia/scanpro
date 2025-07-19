"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  orderBy,
} from "firebase/firestore";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { Modal } from "@/components/ui/Modal";
import { Users, BriefcaseBusiness, Truck, Laptop } from "lucide-react";
import toast from "react-hot-toast";

// --- Interfaces para os Dados ---
type ModalListItem = { name: string; whatsapp?: string };

interface Conference {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  project: string;
  um: string;
  technician: string;
  expected: number;
  scanned: number;
  missing: number;
  missingHostnames: string[];
}

// --- Dados Estáticos para os Modais (serão substituídos no futuro) ---
const mockTechnicians: ModalListItem[] = [
  { name: "João Marcos", whatsapp: "(61) 99999-0001" },
  { name: "José Frederico", whatsapp: "(61) 99999-0002" },
];
const mockProjects: ModalListItem[] = [
  { name: "Projeto Alpha" },
  { name: "Projeto Beta" },
];

export default function DashboardPage() {
  const [summaryData, setSummaryData] = useState({
    technicians: 0,
    projects: 0,
    ums: 0,
    notebooks: 0,
  });
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    data: [] as ModalListItem[] | string[],
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Faz a contagem dos documentos para os cards
        const projectsSnapshot = await getDocs(collection(db, "projects"));
        const umsSnapshot = await getDocs(collection(db, "ums"));
        const notebooksSnapshot = await getDocs(collection(db, "notebooks"));

        // Contagem de técnicos (filtrando por perfil 'USER')
        const techniciansQuery = query(
          collection(db, "users"),
          where("role", "==", "USER")
        );
        const techniciansSnapshot = await getDocs(techniciansQuery);

        setSummaryData({
          technicians: techniciansSnapshot.size,
          projects: projectsSnapshot.size,
          ums: umsSnapshot.size,
          notebooks: notebooksSnapshot.size,
        });

        // 2. Busca as últimas 10 conferências
        const conferencesQuery = query(
          collection(db, "conferences"),
          orderBy("endTime", "desc"),
          limit(10)
        );
        const conferencesSnapshot = await getDocs(conferencesQuery);
        const conferencesList = conferencesSnapshot.docs.map((document) => {
          const data = document.data();
          return {
            id: document.id,
            // Conversão de Timestamps do Firebase para strings legíveis
            date: data.endTime.toDate().toLocaleDateString("pt-BR"),
            startTime: data.startTime
              .toDate()
              .toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            endTime: data.endTime
              .toDate()
              .toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            project: data.projectName,
            um: data.umName,
            technician: data.userName,
            expected: data.expectedCount,
            scanned: data.scannedCount,
            missing: data.missingCount,
            missingHostnames: data.missingDevices || [],
          } as Conference;
        });
        setConferences(conferencesList);
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        toast.error("Não foi possível carregar os dados do dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (title: string, data: ModalListItem[] | string[]) => {
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
          value={isLoading ? "..." : summaryData.technicians}
          icon={Users}
          onDetailsClick={() =>
            openModal("Técnicos Cadastrados", mockTechnicians)
          }
        />
        <DashboardCard
          title="Projetos"
          value={isLoading ? "..." : summaryData.projects}
          icon={BriefcaseBusiness}
          onDetailsClick={() => openModal("Projetos", mockProjects)}
        />
        <DashboardCard
          title="UMs"
          value={isLoading ? "..." : summaryData.ums}
          icon={Truck}
        />
        <DashboardCard
          title="Notebooks Cadastrados"
          value={isLoading ? "..." : summaryData.notebooks}
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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center p-6 text-gray-500">
                    Carregando conferências...
                  </td>
                </tr>
              ) : conferences.length > 0 ? (
                conferences.map((conference) => (
                  <tr
                    key={conference.id}
                    className="border-b hover:bg-slate-50"
                  >
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
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center p-6 text-gray-500">
                    Nenhuma conferência registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end items-center mt-4 text-sm">
          <span>Itens por página: 10</span>
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
