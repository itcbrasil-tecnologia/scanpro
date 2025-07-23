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
import {
  Users,
  BriefcaseBusiness,
  Truck,
  Laptop,
  TriangleAlert,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

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
  const [modalContent, setModalContent] = useState<{
    title: string;
    data: ModalListItem[] | string[];
  }>({ title: "", data: [] });

  const [techniciansList, setTechniciansList] = useState<ModalListItem[]>([]);
  const [projectsList, setProjectsList] = useState<ModalListItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Otimização: Busca todos os dados necessários em paralelo
        const [
          projectsSnapshot,
          umsSnapshot,
          notebooksSnapshot,
          techniciansSnapshot,
          conferencesSnapshot,
        ] = await Promise.all([
          getDocs(collection(db, "projects")),
          getDocs(collection(db, "ums")),
          getDocs(collection(db, "notebooks")),
          getDocs(query(collection(db, "users"), where("role", "==", "USER"))),
          getDocs(
            query(
              collection(db, "conferences"),
              orderBy("endTime", "desc"),
              limit(10)
            )
          ),
        ]);

        // Processa os dados dos cards
        const projectsData = projectsSnapshot.docs.map((doc) => ({
          name: doc.data().name,
        }));
        setProjectsList(projectsData);
        const techniciansData = techniciansSnapshot.docs.map((doc) => ({
          name: doc.data().nome,
          whatsapp: doc.data().whatsapp,
        }));
        setTechniciansList(techniciansData);
        setSummaryData({
          technicians: techniciansSnapshot.size,
          projects: projectsSnapshot.size,
          ums: umsSnapshot.size,
          notebooks: notebooksSnapshot.size,
        });

        // Processa os dados da tabela
        const conferencesList = conferencesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
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
        toast.error("Não foi possível carregar os dados do dashboard.", {
          id: "global-toast",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []); // Roda apenas uma vez na montagem do componente

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
            openModal("Técnicos Cadastrados", techniciansList)
          }
        />
        <DashboardCard
          title="Projetos"
          value={isLoading ? "..." : summaryData.projects}
          icon={BriefcaseBusiness}
          onDetailsClick={() => openModal("Projetos", projectsList)}
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
      <div className="bg-white p-6 rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Últimas Conferências
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-200 border-b-2 border-slate-300">
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
                      {conference.project} / {conference.um}
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
                          className="flex items-center justify-center mx-auto text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full transition-colors"
                          onClick={() =>
                            openModal(
                              "Dispositivos Não Escaneados",
                              conference.missingHostnames
                            )
                          }
                        >
                          <TriangleAlert size={14} className="mr-1.5" />
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
                : `${item.name} ${item.whatsapp ? `(${item.whatsapp})` : ""}`}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
