"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  endBefore,
  limitToLast,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { ScanBarcode, Camera, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 10;

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

export default function InicioPage() {
  const { userProfile } = useAuth();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string[]>([]);
  const [dailyCounts, setDailyCounts] = useState({
    completed: 0,
    total: userProfile?.dailyConferenceGoal || 2,
  });

  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const fetchConferences = useCallback(
    async (direction: "next" | "prev" | "initial" = "initial") => {
      if (!userProfile) return;
      setIsLoading(true);
      try {
        let historyQuery;
        const conferencesCollection = collection(db, "conferences");
        const baseQuery = query(
          conferencesCollection,
          where("userId", "==", userProfile.uid),
          orderBy("endTime", "desc")
        );

        if (direction === "next" && lastVisible) {
          historyQuery = query(
            baseQuery,
            startAfter(lastVisible),
            limit(ITEMS_PER_PAGE)
          );
        } else if (direction === "prev" && firstVisible) {
          historyQuery = query(
            baseQuery,
            endBefore(firstVisible),
            limitToLast(ITEMS_PER_PAGE)
          );
        } else {
          historyQuery = query(baseQuery, limit(ITEMS_PER_PAGE));
        }

        const historySnapshot = await getDocs(historyQuery);
        const userConferences = historySnapshot.docs.map((document) => {
          const data = document.data();
          return {
            id: document.id,
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
            um: data.umName,
            expected: data.expectedCount,
            scanned: data.scannedCount,
            missing: data.missingCount,
            missingHostnames: data.missingDevices || [],
          } as Conference;
        });

        setConferences(userConferences);
        if (!historySnapshot.empty) {
          setFirstVisible(historySnapshot.docs[0]);
          setLastVisible(historySnapshot.docs[historySnapshot.docs.length - 1]);
          setHasNextPage(historySnapshot.docs.length === ITEMS_PER_PAGE);
        } else {
          setHasNextPage(false);
        }
      } catch (error) {
        console.error("Erro ao buscar conferências:", error);
        toast.error("Não foi possível carregar o histórico.", {
          id: "global-toast",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [userProfile, lastVisible, firstVisible]
  );

  useEffect(() => {
    const fetchPageData = async () => {
      if (!userProfile) return;

      setIsLoading(true);
      setDailyCounts((prev) => ({
        ...prev,
        total: userProfile.dailyConferenceGoal || 2,
      }));

      try {
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
        setDailyCounts((currentCounts) => ({
          ...currentCounts,
          completed: dailySnapshot.size,
        }));
      } catch (error) {
        console.error("Erro ao buscar contagem diária:", error);
        toast.error("Não foi possível carregar a contagem diária.", {
          id: "global-toast",
        });
      }

      await fetchConferences("initial");
      setIsLoading(false);
    };

    fetchPageData();
  }, [userProfile, fetchConferences]);

  const handleNextPage = () => {
    if (hasNextPage) {
      setPage((p) => p + 1);
      fetchConferences("next");
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((p) => p - 1);
      fetchConferences("prev");
    }
  };

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
                <CheckCircle size={24} className="mr-3" />
                CONCLUÍDO
              </div>
            ) : (
              <Link href="/scanner" passHref>
                <div className="w-full flex items-center justify-center bg-teal-600 text-white px-4 py-3 rounded-lg shadow-lg hover:bg-teal-700 transition-colors font-bold text-lg">
                  <Camera size={24} className="mr-3" />
                  INICIAR CONFERÊNCIA
                </div>
              </Link>
            )}
          </div>
        </div>
        <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            As suas Últimas Conferências
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
                    <td colSpan={5} className="text-center p-6 text-gray-500">
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
                          {conference.startTime} - {conference.endTime}
                        </p>
                      </td>
                      <td className="p-3 text-sm font-medium">
                        {conference.um}
                      </td>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-gray-500">
                      Nenhuma conferência encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            onNext={handleNextPage}
            onPrev={handlePrevPage}
            hasNextPage={hasNextPage}
            hasPrevPage={page > 1}
            isLoading={isLoading}
          />
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
