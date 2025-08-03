"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Download, Filter, XCircle, Eye } from "lucide-react"; // Importado Eye
import Papa from "papaparse";
import toast from "react-hot-toast";
import { PeripheralsModal } from "@/components/ui/PeripheralsModal"; // Importado

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
  // Novos campos
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
}

interface User {
  uid: string;
  nome: string;
}

interface PeripheralsData {
  miceCount?: number;
  chargersCount?: number;
  headsetsCount?: number;
}

export default function ReportsPage() {
  const [allConferences, setAllConferences] = useState<Conference[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ums, setUms] = useState<UM[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: "",
    projectId: "",
    umId: "",
    technicianId: "",
  });

  // State para o novo modal de periféricos
  const [isPeripheralsModalOpen, setIsPeripheralsModalOpen] = useState(false);
  const [selectedPeripherals, setSelectedPeripherals] =
    useState<PeripheralsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [projectsSnapshot, umsSnapshot, techSnapshot, confSnapshot] =
          await Promise.all([
            getDocs(collection(db, "projects")),
            getDocs(collection(db, "ums")),
            getDocs(
              query(collection(db, "users"), where("role", "==", "USER"))
            ),
            getDocs(
              query(collection(db, "conferences"), orderBy("endTime", "desc"))
            ),
          ]);

        setProjects(
          projectsSnapshot.docs.map(
            (doc) => ({ id: doc.id, name: doc.data().name } as Project)
          )
        );
        setUms(
          umsSnapshot.docs.map(
            (doc) => ({ id: doc.id, name: doc.data().name } as UM)
          )
        );
        setTechnicians(
          techSnapshot.docs.map(
            (doc) => ({ uid: doc.id, nome: doc.data().nome } as User)
          )
        );

        const conferencesList = confSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            date: data.endTime.toDate().toISOString().split("T")[0],
            startTime: data.startTime.toDate().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            endTime: data.endTime.toDate().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            projectName: data.projectName,
            umName: data.umName,
            userName: data.userName,
            expectedCount: data.expectedCount,
            scannedCount: data.scannedCount,
            missingCount: data.missingCount,
            miceCount: data.miceCount,
            chargersCount: data.chargersCount,
            headsetsCount: data.headsetsCount,
          } as Conference;
        });
        setAllConferences(conferencesList);
      } catch (error) {
        console.error("Erro ao buscar dados para relatórios:", error);
        toast.error("Não foi possível carregar os dados.", {
          id: "global-toast",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredConferences = useMemo(() => {
    return allConferences.filter((conference) => {
      const projectMatch = filters.projectId
        ? projects.find((p) => p.id === filters.projectId)?.name ===
          conference.projectName
        : true;
      const umMatch = filters.umId
        ? ums.find((u) => u.id === filters.umId)?.name === conference.umName
        : true;
      const techMatch = filters.technicianId
        ? technicians.find((t) => t.uid === filters.technicianId)?.nome ===
          conference.userName
        : true;
      const dateMatch = filters.date ? conference.date === filters.date : true;

      return projectMatch && umMatch && techMatch && dateMatch;
    });
  }, [filters, allConferences, projects, ums, technicians]);

  const handleFilterChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFilters((previousState) => ({ ...previousState, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ date: "", projectId: "", umId: "", technicianId: "" });
  };

  const openPeripheralsModal = (data: PeripheralsData) => {
    setSelectedPeripherals(data);
    setIsPeripheralsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredConferences.length === 0) {
      toast.error("Nenhum dado para exportar.", { id: "global-toast" });
      return;
    }

    const csvData = Papa.unparse(
      filteredConferences.map((c) => ({
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
        Mouses: c.miceCount ?? 0,
        Carregadores: c.chargersCount ?? 0,
        "Fones de Ouvido": c.headsetsCount ?? 0,
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
                  Periféricos
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 text-center">
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
              ) : filteredConferences.length > 0 ? (
                filteredConferences.map((conference) => (
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
                    <td className="p-3 text-center">
                      {conference.miceCount !== undefined && (
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
                    Nenhum resultado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
