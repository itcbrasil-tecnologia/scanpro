"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  DocumentData,
  QueryDocumentSnapshot,
  Query,
} from "firebase/firestore";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { SkeletonTableRow } from "@/components/ui/SkeletonTableRow"; // Importa o novo componente
import { Download, Filter, XCircle } from "lucide-react";
import Papa from "papaparse";
import toast from "react-hot-toast";

interface Conference {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  projectName: string;
  umName: string;
  userName: string;
  expectedCount: number;
  scannedCount: number;
  missingCount: number;
}

interface Project {
  id: string;
  name: string;
}

interface UM {
  id: string;
  name: string;
}

interface User {
  uid: string;
  nome: string;
}

const ITEMS_PER_PAGE = 15;

export default function ReportsPage() {
  const { userProfile } = useAuth();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ums, setUms] = useState<UM[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: "",
    projectId: "",
    umId: "",
    technicianId: "",
  });

  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const fetchDropdownData = useCallback(async () => {
    try {
      const projectsSnapshot = await getDocs(collection(db, "projects"));
      setProjects(
        projectsSnapshot.docs.map(
          (doc) => ({ id: doc.id, name: doc.data().name } as Project)
        )
      );
      const umsSnapshot = await getDocs(collection(db, "ums"));
      setUms(
        umsSnapshot.docs.map(
          (doc) => ({ id: doc.id, name: doc.data().name } as UM)
        )
      );
      const techQuery = query(
        collection(db, "users"),
        where("role", "==", "USER")
      );
      const techSnapshot = await getDocs(techQuery);
      setTechnicians(
        techSnapshot.docs.map(
          (doc) => ({ uid: doc.id, nome: doc.data().nome } as User)
        )
      );
    } catch (error) {
      console.error("Erro ao buscar dados para filtros:", error);
      toast.error("Não foi possível carregar os filtros.", {
        id: "global-toast",
      });
    }
  }, []);

  const fetchConferences = useCallback(
    async (direction: "next" | "prev" | "initial" = "initial") => {
      setIsDataLoading(true);
      try {
        let conferencesQuery: Query<DocumentData> = collection(
          db,
          "conferences"
        );

        if (filters.technicianId) {
          const tech = technicians.find((t) => t.uid === filters.technicianId);
          if (tech)
            conferencesQuery = query(
              conferencesQuery,
              where("userName", "==", tech.nome)
            );
        }
        if (filters.projectId) {
          const project = projects.find((p) => p.id === filters.projectId);
          if (project)
            conferencesQuery = query(
              conferencesQuery,
              where("projectName", "==", project.name)
            );
        }
        if (filters.umId) {
          const um = ums.find((u) => u.id === filters.umId);
          if (um)
            conferencesQuery = query(
              conferencesQuery,
              where("umName", "==", um.name)
            );
        }
        if (filters.date) {
          const selectedDate = new Date(filters.date);
          const startOfDay = new Date(
            selectedDate.getUTCFullYear(),
            selectedDate.getUTCMonth(),
            selectedDate.getUTCDate()
          );
          const endOfDay = new Date(startOfDay);
          endOfDay.setDate(endOfDay.getDate() + 1);
          conferencesQuery = query(
            conferencesQuery,
            where("endTime", ">=", startOfDay),
            where("endTime", "<", endOfDay)
          );
        }

        conferencesQuery = query(conferencesQuery, orderBy("endTime", "desc"));

        if (direction === "next" && lastVisible) {
          conferencesQuery = query(
            conferencesQuery,
            startAfter(lastVisible),
            limit(ITEMS_PER_PAGE)
          );
        } else if (direction === "prev" && firstVisible) {
          conferencesQuery = query(
            conferencesQuery,
            endBefore(firstVisible),
            limitToLast(ITEMS_PER_PAGE)
          );
        } else {
          conferencesQuery = query(conferencesQuery, limit(ITEMS_PER_PAGE));
        }

        const snapshot = await getDocs(conferencesQuery);
        const conferencesList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            date: data.endTime.toDate().toISOString().split("T")[0],
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
            projectName: data.projectName,
            umName: data.umName,
            userName: data.userName,
            expectedCount: data.expectedCount,
            scannedCount: data.scannedCount,
            missingCount: data.missingCount,
          } as Conference;
        });

        setConferences(conferencesList);
        if (!snapshot.empty) {
          setFirstVisible(snapshot.docs[0]);
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasNextPage(snapshot.docs.length === ITEMS_PER_PAGE);
        } else {
          setHasNextPage(direction === "prev" && snapshot.docs.length > 0);
        }
      } catch (error) {
        console.error("Erro ao buscar relatórios:", error);
        toast.error(
          "Não foi possível carregar os relatórios. Verifique os índices do Firestore.",
          { id: "global-toast" }
        );
      } finally {
        setIsDataLoading(false);
      }
    },
    [filters, lastVisible, firstVisible, projects, ums, technicians]
  );

  useEffect(() => {
    if (userProfile) {
      fetchDropdownData();
      fetchConferences("initial");
    }
  }, [userProfile, filters, fetchConferences, fetchDropdownData]);

  const handleFilterChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setPage(1);
    setLastVisible(null);
    setFirstVisible(null);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setLastVisible(null);
    setFirstVisible(null);
    setFilters({ date: "", projectId: "", umId: "", technicianId: "" });
  };

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

  const handleExportCSV = async () => {
    try {
      let fullQuery: Query<DocumentData> = collection(db, "conferences");
      if (filters.technicianId) {
        const tech = technicians.find((t) => t.uid === filters.technicianId);
        if (tech)
          fullQuery = query(fullQuery, where("userName", "==", tech.nome));
      }
      if (filters.projectId) {
        const project = projects.find((p) => p.id === filters.projectId);
        if (project)
          fullQuery = query(
            fullQuery,
            where("projectName", "==", project.name)
          );
      }
      if (filters.umId) {
        const um = ums.find((u) => u.id === filters.umId);
        if (um) fullQuery = query(fullQuery, where("umName", "==", um.name));
      }
      if (filters.date) {
        const selectedDate = new Date(filters.date);
        const startOfDay = new Date(
          selectedDate.getUTCFullYear(),
          selectedDate.getUTCMonth(),
          selectedDate.getUTCDate()
        );
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);
        fullQuery = query(
          fullQuery,
          where("endTime", ">=", startOfDay),
          where("endTime", "<", endOfDay)
        );
      }

      fullQuery = query(fullQuery, orderBy("endTime", "desc"));

      const snapshot = await getDocs(fullQuery);
      const allFilteredConferences = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.endTime.toDate().toISOString().split("T")[0],
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
          projectName: data.projectName,
          umName: data.umName,
          userName: data.userName,
          expectedCount: data.expectedCount,
          scannedCount: data.scannedCount,
          missingCount: data.missingCount,
        } as Conference;
      });

      if (allFilteredConferences.length === 0) {
        toast.error("Nenhum dado para exportar com os filtros atuais.", {
          id: "global-toast",
        });
        return;
      }

      const csvData = Papa.unparse(
        allFilteredConferences.map((c) => ({
          Data: new Date(c.date).toLocaleDateString("pt-BR", {
            timeZone: "UTC",
          }),
          Inicio: c.startTime,
          Fim: c.endTime,
          Projeto: c.projectName,
          UM: c.umName,
          Tecnico: c.userName,
          Esperados: c.expectedCount,
          Escaneados: c.scannedCount,
          Faltantes: c.missingCount,
        })),
        { header: true }
      );
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "relatorio_conferencias.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      toast.error("Ocorreu um erro ao gerar o arquivo CSV.", {
        id: "global-toast",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Relatórios de Conferências
      </h1>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <Filter size={20} className="mr-2 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-700">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="p-2 border rounded-md bg-white"
          />
          <select
            name="projectId"
            value={filters.projectId}
            onChange={handleFilterChange}
            className="p-2 border rounded-md bg-white"
          >
            <option value="">Todos os Projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            name="umId"
            value={filters.umId}
            onChange={handleFilterChange}
            className="p-2 border rounded-md bg-white"
          >
            <option value="">Todas as UMs</option>
            {ums.map((um) => (
              <option key={um.id} value={um.id}>
                {um.name}
              </option>
            ))}
          </select>
          <select
            name="technicianId"
            value={filters.technicianId}
            onChange={handleFilterChange}
            className="p-2 border rounded-md bg-white"
          >
            <option value="">Todos os Técnicos</option>
            {technicians.map((tech) => (
              <option key={tech.uid} value={tech.uid}>
                {tech.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={clearFilters}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <XCircle size={16} className="mr-1" /> Limpar Filtros
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition-colors"
          >
            <Download size={16} className="mr-2" /> Exportar para .CSV
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-200 border-b-2 border-slate-300">
              <tr>
                <th className="p-3 text-sm font-semibold text-slate-600">
                  Data
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600">
                  Horário
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600">
                  Projeto / UM
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600">
                  Técnico
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 text-center">
                  Escaneados
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 text-center">
                  Faltantes
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 text-center">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {isDataLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={7} />
                ))
              ) : conferences.length > 0 ? (
                conferences.map((conference) => (
                  <tr
                    key={conference.id}
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="p-3">
                      {new Date(conference.date).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td className="p-3">
                      {conference.startTime} - {conference.endTime}
                    </td>
                    <td className="p-3">
                      {conference.projectName} / {conference.umName}
                    </td>
                    <td className="p-3">{conference.userName}</td>
                    <td className="p-3 text-center text-green-600 font-semibold">
                      {conference.scannedCount}
                    </td>
                    <td className="p-3 text-center text-red-600 font-semibold">
                      {conference.missingCount}
                    </td>
                    <td className="p-3 text-center font-bold">
                      {conference.expectedCount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center p-6 text-gray-500">
                    Nenhum resultado encontrado.
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
          isLoading={isDataLoading}
        />
      </div>
    </div>
  );
}
