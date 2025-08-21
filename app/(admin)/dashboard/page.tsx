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
import { AssetLifecycleModal } from "@/components/ui/AssetLifecycleModal";
import { ConferenceSummaryModal } from "@/components/ui/ConferenceSummaryModal";
import { Users, BriefcaseBusiness, Truck, Laptop, Wrench } from "lucide-react"; // CORREÇÃO: Ícones não utilizados foram removidos
import toast from "react-hot-toast";
import { ConferenceData, MaintenanceNotebook } from "@/types";
import { TabelaManutencao } from "@/components/ui/TabelaManutencao";
// CORREÇÃO: Importação alterada para default (sem chaves)
import TabelaConferencias from "@/components/ui/TabelaConferencias";

type ModalListItem = { name: string; whatsapp?: string };

export default function DashboardPage() {
  const [summaryData, setSummaryData] = useState({
    technicians: 0,
    projects: 0,
    ums: 0,
    notebooks: 0,
    maintenance: 0,
  });
  const [conferences, setConferences] = useState<ConferenceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsModalContent, setDetailsModalContent] = useState<{
    title: string;
    data: ModalListItem[] | string[];
  }>({ title: "", data: [] });
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceNotebooks, setMaintenanceNotebooks] = useState<
    MaintenanceNotebook[]
  >([]);
  const [isLifecycleModalOpen, setIsLifecycleModalOpen] = useState(false);
  const [selectedNotebookForHistory, setSelectedNotebookForHistory] =
    useState<MaintenanceNotebook | null>(null);
  const [techniciansList, setTechniciansList] = useState<ModalListItem[]>([]);
  const [projectsList, setProjectsList] = useState<ModalListItem[]>([]);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedConferenceForSummary, setSelectedConferenceForSummary] =
    useState<ConferenceData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const maintenanceQuery = query(
          collection(db, "notebooks"),
          where("status", "==", "Em Manutenção")
        );
        const conferencesQuery = query(
          collection(db, "conferences"),
          orderBy("endTime", "desc"),
          limit(10)
        );

        const [
          projectsSnapshot,
          umsSnapshot,
          notebooksSnapshot,
          techniciansSnapshot,
          maintenanceSnapshot,
          conferencesSnapshot,
        ] = await Promise.all([
          getDocs(collection(db, "projects")),
          getDocs(collection(db, "ums")),
          getDocs(collection(db, "notebooks")),
          getDocs(query(collection(db, "users"), where("role", "==", "USER"))),
          getDocs(maintenanceQuery),
          getDocs(conferencesQuery),
        ]);

        const projectsData = projectsSnapshot.docs.map((doc) => ({
          name: doc.data().name,
        }));
        setProjectsList(projectsData);

        const techniciansData = techniciansSnapshot.docs.map((doc) => ({
          name: doc.data().nome,
          whatsapp: doc.data().whatsapp,
        }));
        setTechniciansList(techniciansData);

        const maintenanceData = maintenanceSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as MaintenanceNotebook)
        );
        setMaintenanceNotebooks(maintenanceData);

        setSummaryData({
          technicians: techniciansSnapshot.size,
          projects: projectsSnapshot.size,
          ums: umsSnapshot.size,
          notebooks: notebooksSnapshot.size,
          maintenance: maintenanceSnapshot.size,
        });

        const conferencesList = conferencesSnapshot.docs.map((doc) => {
          const data = doc.data() as ConferenceData;
          return {
            ...data,
            id: doc.id,
          };
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
  }, []);

  const openDetailsModal = (
    title: string,
    data: ModalListItem[] | string[]
  ) => {
    setDetailsModalContent({ title, data });
    setIsDetailsModalOpen(true);
  };

  const openHistoryModal = (notebook: MaintenanceNotebook) => {
    setSelectedNotebookForHistory(notebook);
    setIsLifecycleModalOpen(true);
  };

  const openSummaryModal = (conference: ConferenceData) => {
    setSelectedConferenceForSummary(conference);
    setIsSummaryModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardCard
          title="Técnicos Cadastrados"
          value={isLoading ? "..." : summaryData.technicians}
          icon={Users}
          onDetailsClick={() =>
            openDetailsModal("Técnicos Cadastrados", techniciansList)
          }
        />
        <DashboardCard
          title="Projetos"
          value={isLoading ? "..." : summaryData.projects}
          icon={BriefcaseBusiness}
          onDetailsClick={() => openDetailsModal("Projetos", projectsList)}
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
        <DashboardCard
          title="Em Manutenção"
          value={isLoading ? "..." : summaryData.maintenance}
          icon={Wrench}
          onDetailsClick={() => setIsMaintenanceModalOpen(true)}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Últimas Conferências
        </h2>
        {isLoading ? (
          <p className="text-center text-gray-500 py-6">
            Carregando conferências...
          </p>
        ) : conferences.length > 0 ? (
          <TabelaConferencias
            data={conferences}
            openSummaryModal={openSummaryModal}
          />
        ) : (
          <p className="text-center text-gray-500 py-6">
            Nenhuma conferência registrada ainda.
          </p>
        )}
      </div>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={detailsModalContent.title}
      >
        <ul className="space-y-2">
          {detailsModalContent.data.map((item, index) => (
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

      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        title="Notebooks em Manutenção"
      >
        <div className="max-h-[60vh] overflow-y-auto">
          {maintenanceNotebooks.length > 0 ? (
            <TabelaManutencao
              data={maintenanceNotebooks}
              openHistoryModal={openHistoryModal}
            />
          ) : (
            <p className="text-center text-gray-500 py-4">
              Não há notebooks em manutenção no momento.
            </p>
          )}
        </div>
      </Modal>

      <AssetLifecycleModal
        isOpen={isLifecycleModalOpen}
        onClose={() => setIsLifecycleModalOpen(false)}
        notebook={selectedNotebookForHistory}
      />

      <ConferenceSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        conferenceData={selectedConferenceForSummary}
      />
    </div>
  );
}
