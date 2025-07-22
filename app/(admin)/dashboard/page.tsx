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
import { useAuth } from "@/context/AuthContext";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { Modal } from "@/components/ui/Modal";
import { Users, BriefcaseBusiness, Truck, Laptop } from "lucide-react";
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
  const { userProfile } = useAuth();
  const [summaryData, setSummaryData] = useState({
    technicians: 0,
    projects: 0,
    ums: 0,
    notebooks: 0,
  });
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    data: ModalListItem[] | string[];
  }>({ title: "", data: [] });

  const [techniciansList, setTechniciansList] = useState<ModalListItem[]>([]);
  const [projectsList, setProjectsList] = useState<ModalListItem[]>([]);

  useEffect(() => {
    if (userProfile) {
      const fetchData = async () => {
        setIsDataLoading(true);
        try {
          const projectsSnapshot = await getDocs(collection(db, "projects"));
          const umsSnapshot = await getDocs(collection(db, "ums"));
          const notebooksSnapshot = await getDocs(collection(db, "notebooks"));
          const techniciansQuery = query(
            collection(db, "users"),
            where("role", "==", "USER")
          );
          const techniciansSnapshot = await getDocs(techniciansQuery);

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

          const conferencesQuery = query(
            collection(db, "conferences"),
            orderBy("endTime", "desc"),
            limit(10)
          );
          const conferencesSnapshot = await getDocs(conferencesQuery);
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
          setIsDataLoading(false);
        }
      };
      fetchData();
    }
  }, [userProfile]);

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
          value={isDataLoading ? "..." : summaryData.technicians}
          icon={Users}
          onDetailsClick={() =>
            openModal("Técnicos Cadastrados", techniciansList)
          }
        />
        <DashboardCard
          title="Projetos"
          value={isDataLoading ? "..." : summaryData.projects}
          icon={BriefcaseBusiness}
          onDetailsClick={() => openModal("Projetos", projectsList)}
        />
        <DashboardCard
          title="UMs"
          value={isDataLoading ? "..." : summaryData.ums}
          icon={Truck}
        />
        <DashboardCard
          title="Notebooks Cadastrados"
          value={isDataLoading ? "..." : summaryData.notebooks}
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
              {isDataLoading ? (
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
