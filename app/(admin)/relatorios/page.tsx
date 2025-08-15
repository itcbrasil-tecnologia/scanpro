"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { Download, Eye, Filter, X } from "lucide-react";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { PeripheralsModal } from "@/components/ui/PeripheralsModal";
import { PaginationControls } from "@/components/ui/PaginationControls";

// Interfaces de Dados
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
  miceCount?: number;
  chargersCount?: number;
  headsetsCount?: number;
}
interface PeripheralsData {
  miceCount?: number;
  chargersCount?: number;
  headsetsCount?: number;
}
interface Project {
  id: string;
  name: string;
}
interface UM {
  id: string;
  name: string;
  projectId: string;
}
interface Technician {
  uid: string;
  nome: string;
}
interface Filters {
  projectId: string;
  umId: string;
  technicianId: string;
  startDate: string;
  endDate: string;
}

const ITEMS_PER_PAGE = 15;

export default function ReportsPage() {
  // Estados de dados e UI
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPeripheralsModalOpen, setIsPeripheralsModalOpen] = useState(false);
  const [selectedPeripherals, setSelectedPeripherals] =
    useState<PeripheralsData | null>(null);

  // Estados para Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Estados para Filtros
  const [projects, setProjects] = useState<Project[]>([]);
  const [ums, setUms] = useState<UM[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filters, setFilters] = useState<Filters>({
    projectId: "",
    umId: "",
    technicianId: "",
    startDate: "",
    endDate: "",
  });

  // Carrega dados para preencher os menus de filtro
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [projectsSnap, umsSnap, techniciansSnap] = await Promise.all([
          getDocs(query(collection(db, "projects"), orderBy("name"))),
          getDocs(query(collection(db, "ums"), orderBy("name"))),
          getDocs(
            query(
              collection(db, "users"),
              where("role", "==", "USER"),
              orderBy("nome")
            )
          ),
        ]);
        setProjects(
          projectsSnap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Project)
          )
        );
        setUms(
          umsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UM))
        );
        setTechnicians(
          techniciansSnap.docs.map(
            (doc) =>
              ({
                uid: doc.id,
                nome: doc.data().nome,
              } as Technician)
          )
        );
      } catch (error) {
        console.error("Erro ao buscar dados para filtros:", error);
        toast.error("Não foi possível carregar as opções de filtro.");
      }
    };
    fetchFilterData();
  }, []);

  const mapDocToConference = (
    doc: QueryDocumentSnapshot<DocumentData>
  ): Conference => {
    const data = doc.data();
    return {
      id: doc.id,
      date: data.endTime.toDate().toLocaleDateString("pt-BR"),
      startTime: data.startTime
        .toDate()
        .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      endTime: data.endTime
        .toDate()
        .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      projectName: data.projectName,
      umName: data.umName,
      userName: data.userName,
      expectedCount: data.expectedCount,
      scannedCount: data.scannedCount,
      missingCount: data.missingCount,
      miceCount: data.miceCount,
      chargersCount: data.chargersCount,
      headsetsCount: data.headsetsCount,
    };
  };

  const fetchConferences = useCallback(
    async (
      page: number,
      startingAfter?: QueryDocumentSnapshot<DocumentData>
    ) => {
      setIsLoading(true);
      try {
        const conferencesRef = collection(db, "conferences");
        const queryConstraints: QueryConstraint[] = [];

        if (filters.projectId) {
          const selectedProject = projects.find(
            (p) => p.id === filters.projectId
          );
          if (selectedProject)
            queryConstraints.push(
              where("projectName", "==", selectedProject.name)
            );
        }
        if (filters.umId) {
          const selectedUm = ums.find((u) => u.id === filters.umId);
          if (selectedUm)
            queryConstraints.push(where("umName", "==", selectedUm.name));
        }
        if (filters.technicianId) {
          queryConstraints.push(where("userId", "==", filters.technicianId));
        }
        if (filters.startDate) {
          queryConstraints.push(
            where(
              "endTime",
              ">=",
              Timestamp.fromDate(new Date(filters.startDate))
            )
          );
        }
        if (filters.endDate) {
          const endOfDay = new Date(filters.endDate);
          endOfDay.setHours(23, 59, 59, 999);
          queryConstraints.push(
            where("endTime", "<=", Timestamp.fromDate(endOfDay))
          );
        }

        const countQuery = query(conferencesRef, ...queryConstraints);
        const countSnapshot = await getDocs(countQuery);
        setTotalPages(Math.ceil(countSnapshot.size / ITEMS_PER_PAGE));

        const dataQueryConstraints = [
          ...queryConstraints,
          orderBy("endTime", "desc"),
          limit(ITEMS_PER_PAGE),
        ];
        if (page > 1 && startingAfter) {
          dataQueryConstraints.push(startAfter(startingAfter));
        }

        const dataQuery = query(conferencesRef, ...dataQueryConstraints);
        const documentSnapshots = await getDocs(dataQuery);

        setConferences(documentSnapshots.docs.map(mapDocToConference));
        setLastVisible(
          documentSnapshots.docs[documentSnapshots.docs.length - 1] || null
        );
        setCurrentPage(page);
      } catch (error) {
        console.error("Erro ao buscar dados para relatórios:", error);
        toast.error(
          "Não foi possível carregar os dados. Verifique o console para criar o índice no Firestore, se necessário.",
          { duration: 6000 }
        );
      } finally {
        setIsLoading(false);
      }
    },
    [filters, projects, ums]
  );

  const handleApplyFilters = () => {
    fetchConferences(1);
  };
  const handleClearFilters = () => {
    setFilters({
      projectId: "",
      umId: "",
      technicianId: "",
      startDate: "",
      endDate: "",
    });
  };

  useEffect(() => {
    if (Object.values(filters).every((val) => val === "")) {
      fetchConferences(1);
    }
  }, [filters, fetchConferences]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > currentPage && lastVisible) {
      fetchConferences(newPage, lastVisible);
    } else if (newPage < currentPage) {
      fetchConferences(1);
    }
  };

  const openPeripheralsModal = (data: PeripheralsData) => {
    setSelectedPeripherals(data);
    setIsPeripheralsModalOpen(true);
  };

  const filteredUms = filters.projectId
    ? ums.filter((um) => um.projectId === filters.projectId)
    : ums;

  const handleExportCSV = async () => {
    toast.loading("Exportando dados...", { id: "global-toast" });
    try {
      const conferencesRef = collection(db, "conferences");
      const queryConstraints: QueryConstraint[] = [];

      // 1. Constrói a consulta com os filtros atuais, igual a `fetchConferences`
      if (filters.projectId) {
        const selectedProject = projects.find(
          (p) => p.id === filters.projectId
        );
        if (selectedProject)
          queryConstraints.push(
            where("projectName", "==", selectedProject.name)
          );
      }
      if (filters.umId) {
        const selectedUm = ums.find((u) => u.id === filters.umId);
        if (selectedUm)
          queryConstraints.push(where("umName", "==", selectedUm.name));
      }
      if (filters.technicianId) {
        queryConstraints.push(where("userId", "==", filters.technicianId));
      }
      if (filters.startDate) {
        queryConstraints.push(
          where(
            "endTime",
            ">=",
            Timestamp.fromDate(new Date(filters.startDate))
          )
        );
      }
      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        queryConstraints.push(
          where("endTime", "<=", Timestamp.fromDate(endOfDay))
        );
      }

      // 2. Cria a query final para exportação (sem limit)
      const exportQuery = query(
        conferencesRef,
        ...queryConstraints,
        orderBy("endTime", "desc")
      );
      const dataToExportSnapshot = await getDocs(exportQuery);
      const dataToExport = dataToExportSnapshot.docs.map((doc) =>
        mapDocToConference(doc as QueryDocumentSnapshot<DocumentData>)
      );

      if (dataToExport.length === 0) {
        toast.error("Nenhum dado para exportar com os filtros atuais.", {
          id: "global-toast",
        });
        return;
      }

      // 3. Usa PapaParse para converter os dados filtrados para CSV
      const csvData = Papa.unparse(
        dataToExport.map((c) => ({
          Data: c.date,
          Inicio: c.startTime,
          Fim: c.endTime,
          Projeto: c.projectName,
          UM: c.umName,
          Tecnico: c.userName,
          Esperados: c.expectedCount,
          Escaneados: c.scannedCount,
          Faltantes: c.missingCount,
          Mouses: c.miceCount ?? 0,
          Carregadores: c.chargersCount ?? 0,
          "Fones de Ouvido": c.headsetsCount ?? 0,
        })),
        { header: true }
      );

      // 4. Lógica para criar e baixar o arquivo blob
      const blob = new Blob([`\uFEFF${csvData}`], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "relatorio_scanpro.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Relatório exportado com sucesso!", { id: "global-toast" });
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      toast.error("Falha ao exportar relatório.", { id: "global-toast" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Relatórios de Conferências
        </h1>
        <button
          onClick={handleExportCSV}
          className="flex items-center text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition-colors"
        >
          <Download size={16} className="mr-2" /> Exportar CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <select
            name="projectId"
            value={filters.projectId}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="">Todos os Projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            name="umId"
            value={filters.umId}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="">Todas as UMs</option>
            {filteredUms.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <select
            name="technicianId"
            value={filters.technicianId}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="">Todos os Técnicos</option>
            {technicians.map((t) => (
              <option key={t.uid} value={t.uid}>
                {t.nome}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleClearFilters}
            className="flex items-center text-sm bg-gray-500 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-600 transition-colors"
          >
            <X size={16} className="mr-2" /> Limpar Filtros
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex items-center text-sm bg-teal-600 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition-colors"
          >
            <Filter size={16} className="mr-2" /> Aplicar Filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-200 border-b-2 border-slate-300">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-800">
                  Data
                </th>
                <th className="p-3 text-sm font-semibold text-gray-800">
                  Horário
                </th>
                <th className="p-3 text-sm font-semibold text-gray-800">
                  Projeto / UM
                </th>
                <th className="p-3 text-sm font-semibold text-gray-800">
                  Técnico
                </th>
                <th className="p-3 text-sm font-semibold text-gray-800 text-center">
                  Escaneados
                </th>
                <th className="p-3 text-sm font-semibold text-gray-800 text-center">
                  Faltantes
                </th>
                <th className="p-3 text-sm font-semibold text-gray-800 text-center">
                  Periféricos
                </th>
                <th className="p-3 text-sm font-semibold text-gray-800 text-center">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center p-6 text-gray-500">
                    Carregando relatórios...
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
                      {conference.projectName} / {conference.umName}
                    </td>
                    <td className="p-3">{conference.userName}</td>
                    <td className="p-3 text-center text-green-600 font-semibold">
                      {conference.scannedCount}
                    </td>
                    <td className="p-3 text-center text-red-600 font-semibold">
                      {conference.missingCount}
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
                          Visualizar
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold">
                      {conference.expectedCount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center p-6 text-gray-500">
                    Nenhum resultado encontrado para os filtros selecionados.
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

      <PeripheralsModal
        isOpen={isPeripheralsModalOpen}
        onClose={() => setIsPeripheralsModalOpen(false)}
        data={selectedPeripherals}
      />
    </div>
  );
}
