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
import { ScanBarcode, Camera, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { ConferenceData } from "@/types";
import { TabelaHistorico } from "@/components/ui/TabelaHistorico";

interface PeripheralsData {
  miceCount?: number;
  chargersCount?: number;
  headsetsCount?: number;
}

const ITEMS_PER_PAGE = 10;

export default function InicioPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [conferences, setConferences] = useState<ConferenceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
          };
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
    [userProfile]
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
      fetchConferences(1);
    };

    fetchStaticData();
  }, [userProfile, router, fetchConferences]);

  const handlePageChange = (newPage: number) => {
    if (newPage > currentPage && lastVisible) {
      fetchConferences(newPage, lastVisible);
    } else if (newPage < currentPage) {
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

  if (!userProfile || userProfile.role !== "USER") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 dark:text-zinc-400">Carregando...</div>
      </div>
    );
  }

  const allDailyCountsCompleted = dailyCounts.completed >= dailyCounts.total;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-zinc-100">
        Bem-vindo, {userProfile?.nome?.split(" ")[0]}!
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md text-center dark:bg-zinc-800">
            <h3 className="font-bold text-gray-700 dark:text-zinc-200">
              Contagens Diárias Disponíveis
            </h3>
            <div className="flex justify-center items-center my-2">
              <ScanBarcode className="w-10 h-10 text-teal-600 dark:text-teal-400" />
              <p className="text-4xl font-bold text-gray-800 ml-4 dark:text-zinc-100">
                {dailyCounts.total - dailyCounts.completed}/{dailyCounts.total}
              </p>
            </div>
          </div>

          <div className="sm:hidden">
            {allDailyCountsCompleted ? (
              <div className="w-full flex items-center justify-center bg-gray-200 text-gray-500 px-4 py-3 rounded-lg font-bold text-lg dark:bg-zinc-700 dark:text-zinc-400">
                <CheckCircle size={24} className="mr-3" /> CONCLUÍDO
              </div>
            ) : (
              <Link
                href="/scanner"
                className="inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-80 bg-teal-600 text-white hover:bg-teal-700 w-full text-lg px-6 py-3 shadow-lg"
              >
                <Camera size={24} className="mr-3" /> INICIAR CONFERÊNCIA
              </Link>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-md overflow-hidden dark:bg-zinc-800">
          <h2 className="text-xl font-bold text-gray-800 mb-4 dark:text-zinc-100">
            Seu Histórico de Conferências
          </h2>
          {isLoading ? (
            <p className="text-center text-gray-500 p-6 dark:text-zinc-400">
              Carregando histórico...
            </p>
          ) : conferences.length > 0 ? (
            <TabelaHistorico
              data={conferences}
              openDetailsModal={openDetailsModal}
              openPeripheralsModal={openPeripheralsModal}
              openSummaryModal={openSummaryModal}
            />
          ) : (
            <p className="text-center text-gray-500 p-6 dark:text-zinc-400">
              Nenhuma conferência encontrada.
            </p>
          )}

          <div className="p-4 border-t dark:border-zinc-700">
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
              className="bg-gray-100 p-2 rounded-md text-gray-700 font-mono dark:bg-zinc-700 dark:text-zinc-200"
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
