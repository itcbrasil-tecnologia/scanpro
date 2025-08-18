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
  Timestamp,
} from "firebase/firestore";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { Modal } from "@/components/ui/Modal";
import { AssetLifecycleModal } from "@/components/ui/AssetLifecycleModal";
import { ConferenceSummaryModal } from "@/components/ui/ConferenceSummaryModal";
import {
  Users,
  BriefcaseBusiness,
  Truck,
  Laptop,
  Wrench,
  History,
  MapPin,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { ConferenceData } from "@/types";

type ModalListItem = { name: string; whatsapp?: string };

interface Conference extends ConferenceData {
  id: string;
  project: string;
  um: string;
  technician: string;
  expected: number;
  scanned: number;
  missing: number;
}

interface MaintenanceNotebook {
  id: string;
  hostname: string;
  serialNumber?: string;
  assetTag?: string;
  maintenanceStartDate?: Timestamp;
}

export default function DashboardPage() {
  const [summaryData, setSummaryData] = useState({
    technicians: 0,
    projects: 0,
    ums: 0,
    notebooks: 0,
    maintenance: 0,
  });
  const [conferences, setConferences] = useState<Conference[]>([]);
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
          const data = doc.data();
          // CORREÇÃO: Removido o `...data` que causava o erro de renderização do Timestamp
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
            missingDevices: data.missingDevices || [],
            maintenanceDevices: data.maintenanceDevices || [],
            miceCount: data.miceCount,
            chargersCount: data.chargersCount,
            headsetsCount: data.headsetsCount,
            latitude: data.latitude,
            longitude: data.longitude,
            // Adicione outros campos da ConferenceData aqui se necessário
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

  const renderStatus = (scanned: number, expected: number) => {
    const isCompleted = scanned === expected;
    const bgColor = isCompleted
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
    return (
      <span
        className={`px-3 py-1 text-sm font-semibold rounded-full ${bgColor}`}
      >
        {isCompleted ? "Concluído" : "Incompleto"}
      </span>
    );
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
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-200 border-b-2 border-slate-300">
              <tr>
                <th className="p-3 text-sm font-semibold text-slate-600">
                  Data
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600">
                  Projeto / UM
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
                  Localidade
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 text-center">
                  Resumo
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
                    <td className="p-3 text-sm">
                      {conference.date}
                      <br />
                      <span className="text-xs text-gray-500">
                        {conference.startTime} - {conference.endTime}
                      </span>
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
                      {conference.latitude && conference.longitude && (
                        <a
                          href={`https://maps.google.com/?q=${conference.latitude},${conference.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:underline font-semibold flex items-center justify-center"
                        >
                          <MapPin size={14} className="mr-1" /> Link
                        </a>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openSummaryModal(conference)}
                        className="flex items-center justify-center mx-auto text-xs font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-full transition-colors"
                      >
                        <FileText size={14} className="mr-1.5" /> Ver
                      </button>
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
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 font-semibold text-slate-600">Hostname</th>
                  <th className="p-2 font-semibold text-slate-600">S/N</th>
                  <th className="p-2 font-semibold text-slate-600">
                    Patrimônio
                  </th>
                  <th className="p-2 font-semibold text-slate-600">
                    Data de Envio
                  </th>
                  <th className="p-2 font-semibold text-slate-600 text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {maintenanceNotebooks.map((nb) => (
                  <tr key={nb.id} className="border-b">
                    <td className="p-2 font-mono">{nb.hostname}</td>
                    <td className="p-2">{nb.serialNumber || "-"}</td>
                    <td className="p-2">{nb.assetTag || "-"}</td>
                    <td className="p-2">
                      {nb.maintenanceStartDate
                        ?.toDate()
                        .toLocaleDateString("pt-BR") || "-"}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => openHistoryModal(nb)}
                        className="text-gray-500 hover:text-blue-600"
                        title="Ver Histórico do Ativo"
                      >
                        <History size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
