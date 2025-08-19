"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import { Modal } from "@/components/ui/Modal";
import { PeripheralsModal } from "@/components/ui/PeripheralsModal";
import { ConferenceSummaryModal } from "@/components/ui/ConferenceSummaryModal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import {
  ScanBarcode,
  Camera,
  CheckCircle,
  TriangleAlert,
  FileText,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { ConferenceData } from "@/types";

interface ConferenceForHistory extends ConferenceData {
  date: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
}

interface PeripheralsData {
  miceCount?: number;
  chargersCount?: number;
  headsetsCount?: number;
}

// ADICIONADO: Constante para definir a quantidade de itens por página
const ITEMS_PER_PAGE = 10;

export default function InicioPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [conferences, setConferences] = useState<ConferenceForHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para a paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string[]>([]);
  const [isPeripheralsModalOpen, setIsPeripheralsModalOpen] = useState(false);
  const [selectedPeripherals, setSelectedPeripherals] =
    useState<PeripheralsData | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedConferenceForSummary, setSelectedConferenceForSummary] =
    useState<ConferenceData | null>(null);

  const [dailyCounts, setDailyCounts] = useState({
    completed: 0,
    total: 2,
  });

  const fetchConferences = useCallback(
    async (
      page: number,
      startingAfter?: QueryDocumentSnapshot<DocumentData>
    ) => {
      if (!userProfile) return;
      setIsLoading(true);
      try {
        const conferencesRef = collection(db, "conferences");
        const userConferencesQuery = where("userId", "==", userProfile.uid);

        // ADICIONADO: Lógica para contar o total de documentos e definir o total de páginas na primeira carga
        if (page === 1) {
          const countQuery = query(conferencesRef, userConferencesQuery);
          const countSnapshot = await getDocs(countQuery);
          setTotalPages(Math.ceil(countSnapshot.size / ITEMS_PER_PAGE));
        }

        const queryConstraints: QueryConstraint[] = [
          userConferencesQuery,
          orderBy("endTime", "desc"),
          limit(ITEMS_PER_PAGE),
        ];

        if (page > 1 && startingAfter) {
          queryConstraints.push(startAfter(startingAfter));
        }

        const historyQuery = query(conferencesRef, ...queryConstraints);
        const historySnapshot = await getDocs(historyQuery);

        const userConferences = historySnapshot.docs.map((document) => {
          const data = document.data() as ConferenceData;
          return {
            ...data,
            id: document.id,
            date: data.endTime.toDate().toLocaleDateString("pt-BR"),
            startTimeFormatted: data.startTime
              .toDate()
              .toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            endTimeFormatted: data.endTime
              .toDate()
              .toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
          } as ConferenceForHistory;
        });

        setConferences(userConferences);
        setLastVisible(
          historySnapshot.docs[historySnapshot.docs.length - 1] || null
        );
        setCurrentPage(page);
      } catch (error) {
        console.error("Erro ao buscar conferências:", error);
        toast.error("Não foi possível carregar seu histórico de conferências.");
      } finally {
        setIsLoading(false);
      }
    },
    [userProfile] // totalPages foi removido para evitar recargas desnecessárias
  );

  useEffect(() => {
    const fetchStaticData = async () => {
      if (!userProfile || userProfile.role !== "USER") {
        if (
          userProfile &&
          (userProfile.role === "MASTER" || userProfile.role === "ADMIN")
        ) {
          router.replace("/dashboard");
        }
        return;
      }

      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );
      const dailyCountQuery = query(
        collection(db, "conferences"),
        where("userId", "==", userProfile.uid),
        where("endTime", ">=", Timestamp.fromDate(startOfDay)),
        where("endTime", "<", Timestamp.fromDate(endOfDay))
      );
      const dailySnapshot = await getDocs(dailyCountQuery);
      setDailyCounts({
        completed: dailySnapshot.size,
        total: userProfile.dailyConferenceGoal || 2,
      });

      // Inicia a busca pela primeira página
      fetchConferences(1);
    };

    fetchStaticData();
  }, [userProfile, router, fetchConferences]);

  const handlePageChange = (newPage: number) => {
    if (newPage > currentPage && lastVisible) {
      fetchConferences(newPage, lastVisible);
    } else if (newPage < currentPage) {
      // Para voltar, reiniciamos a busca da primeira página.
      // Uma implementação mais complexa para "voltar" não é necessária aqui e
      // este modelo simples é eficiente e funcional.
      fetchConferences(1);
    }
  };

  const openDetailsModal = (hostnames: string[]) => {
    setModalContent(hostnames);
    setIsDetailsModalOpen(true);
  };
  const openPeripheralsModal = (data: PeripheralsData) => {
    setSelectedPeripherals(data);
    setIsPeripheralsModalOpen(true);
  };
  const openSummaryModal = (conference: ConferenceData) => {
    setSelectedConferenceForSummary(conference);
    setIsSummaryModalOpen(true);
  };
  const renderStatus = (conference: ConferenceData) => {
    const isComplete = conference.scannedCount === conference.expectedCount;
    const style = isComplete
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full ${style}`}>
        {isComplete ? "CONCLUÍDO" : "INCOMPLETO"}
      </span>
    );
  };

  if (!userProfile || userProfile.role !== "USER") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  const allDailyCountsCompleted = dailyCounts.completed >= dailyCounts.total;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Bem-vindo, {userProfile?.nome?.split(" ")[0]}!
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <h3 className="font-bold text-gray-700">
              Contagens Diárias Disponíveis
            </h3>
            <div className="flex justify-center items-center my-2">
              <ScanBarcode className="w-10 h-10 text-teal-600" />
              <p className="text-4xl font-bold text-gray-800 ml-4">
                {dailyCounts.total - dailyCounts.completed}/{dailyCounts.total}
              </p>
            </div>
          </div>
          <div className="sm:hidden">
            {allDailyCountsCompleted ? (
              <div className="w-full flex items-center justify-center bg-gray-200 text-gray-500 px-4 py-3 rounded-lg font-bold text-lg">
                <CheckCircle size={24} className="mr-3" /> CONCLUÍDO
              </div>
            ) : (
              <Link href="/scanner" passHref>
                <div className="w-full flex items-center justify-center bg-teal-600 text-white px-4 py-3 rounded-lg shadow-lg hover:bg-teal-700 transition-colors font-bold text-lg">
                  <Camera size={24} className="mr-3" /> INICIAR CONFERÊNCIA
                </div>
              </Link>
            )}
          </div>
        </div>
        <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Seu Histórico de Conferências
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
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
                    Periféricos
                  </th>
                  <th className="p-3 text-sm font-semibold text-slate-600 text-center">
                    Status
                  </th>
                  <th className="p-3 text-sm font-semibold text-slate-600 text-center">
                    Detalhes
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
                      A carregar histórico...
                    </td>
                  </tr>
                ) : conferences.length > 0 ? (
                  conferences.map((conference) => (
                    <tr
                      key={conference.id}
                      className="border-b hover:bg-slate-50"
                    >
                      <td className="p-3 text-sm">
                        <p>{conference.date}</p>
                        <p className="text-xs text-gray-500">
                          {conference.startTimeFormatted} -{" "}
                          {conference.endTimeFormatted}
                        </p>
                      </td>
                      <td className="p-3 text-sm font-medium">
                        {conference.umName}
                      </td>
                      <td className="p-3 text-sm text-center">
                        {conference.scannedCount} / {conference.expectedCount}
                      </td>
                      <td className="p-3 text-center">
                        {(conference.miceCount !== undefined ||
                          conference.chargersCount !== undefined ||
                          conference.headsetsCount !== undefined) && (
                          <button
                            className="flex items-center justify-center mx-auto text-xs font-semibold text-teal-800 bg-teal-100 hover:bg-teal-200 px-3 py-1 rounded-full transition-colors"
                            onClick={() => openPeripheralsModal(conference)}
                          >
                            <Eye size={14} className="mr-1.5" />
                            Ver
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {renderStatus(conference)}
                      </td>
                      <td className="p-3 text-center">
                        {conference.missingCount > 0 && (
                          <button
                            className="flex items-center justify-center mx-auto text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full transition-colors"
                            onClick={() =>
                              openDetailsModal(conference.missingDevices)
                            }
                          >
                            <TriangleAlert size={14} className="mr-1.5" />
                            Ver Faltantes
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          className="flex items-center justify-center mx-auto text-xs font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-full transition-colors"
                          onClick={() => openSummaryModal(conference)}
                        >
                          <FileText size={14} className="mr-1.5" />
                          Ver Resumo
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center p-6 text-gray-500">
                      Nenhuma conferência encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
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

      <PeripheralsModal
        isOpen={isPeripheralsModalOpen}
        onClose={() => setIsPeripheralsModalOpen(false)}
        data={selectedPeripherals}
      />

      <ConferenceSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        conferenceData={selectedConferenceForSummary}
      />
    </div>
  );
}
