// app/(admin)/relatorios/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Download, Filter, XCircle } from "lucide-react";
import Papa from "papaparse";

// --- Interfaces e Dados Estáticos (Mock) ---
interface Conference {
  id: string;
  date: string; // Formato YYYY-MM-DD para facilitar a filtragem
  startTime: string;
  endTime: string;
  project: string;
  um: string;
  technician: string;
  expected: number;
  scanned: number;
  missing: number;
}

const mockConferences: Conference[] = [
  {
    id: "conf1",
    date: "2025-07-17",
    startTime: "08:05",
    endTime: "08:15",
    project: "Projeto Alpha",
    um: "BSBIA01",
    technician: "João Marcos",
    expected: 105,
    scanned: 105,
    missing: 0,
  },
  {
    id: "conf2",
    date: "2025-07-17",
    startTime: "17:30",
    endTime: "17:42",
    project: "Projeto Beta",
    um: "SPV01",
    technician: "Lucas Andrade",
    expected: 12,
    scanned: 10,
    missing: 2,
  },
  {
    id: "conf3",
    date: "2025-07-18",
    startTime: "08:01",
    endTime: "08:12",
    project: "Projeto Alpha",
    um: "BSBIA02",
    technician: "José Frederico",
    expected: 105,
    scanned: 104,
    missing: 1,
  },
  {
    id: "conf4",
    date: "2025-07-18",
    startTime: "09:20",
    endTime: "09:25",
    project: "Projeto Gamma",
    um: "CODHAB01",
    technician: "Lucas Veras",
    expected: 11,
    scanned: 11,
    missing: 0,
  },
];

const mockProjects = ["Projeto Alpha", "Projeto Beta", "Projeto Gamma"];
const mockUms = ["BSBIA01", "BSBIA02", "SPV01", "CODHAB01"];
const mockTechnicians = [
  "João Marcos",
  "Lucas Andrade",
  "José Frederico",
  "Lucas Veras",
];
// --- Fim dos Dados Estáticos ---

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    date: "",
    project: "",
    um: "",
    technician: "",
  });
  const [filteredConferences, setFilteredConferences] =
    useState<Conference[]>(mockConferences);

  useEffect(() => {
    let data = [...mockConferences];
    if (filters.date) {
      data = data.filter((c) => c.date === filters.date);
    }
    if (filters.project) {
      data = data.filter((c) => c.project === filters.project);
    }
    if (filters.um) {
      data = data.filter((c) => c.um === filters.um);
    }
    if (filters.technician) {
      data = data.filter((c) => c.technician === filters.technician);
    }
    setFilteredConferences(data);
  }, [filters]);

  const handleFilterChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ date: "", project: "", um: "", technician: "" });
  };

  const handleExportCSV = () => {
    const csvData = Papa.unparse(filteredConferences, {
      header: true,
      columns: [
        "date",
        "startTime",
        "endTime",
        "project",
        "um",
        "technician",
        "expected",
        "scanned",
        "missing",
      ],
    });

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "relatorio_conferencias.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Relatórios de Conferências
      </h1>

      {/* Seção de Filtros */}
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
            className="p-2 border rounded-md"
          />
          <select
            name="project"
            value={filters.project}
            onChange={handleFilterChange}
            className="p-2 border rounded-md bg-white"
          >
            <option value="">Todos os Projetos</option>
            {mockProjects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            name="um"
            value={filters.um}
            onChange={handleFilterChange}
            className="p-2 border rounded-md bg-white"
          >
            <option value="">Todas as UMs</option>
            {mockUms.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <select
            name="technician"
            value={filters.technician}
            onChange={handleFilterChange}
            className="p-2 border rounded-md bg-white"
          >
            <option value="">Todos os Técnicos</option>
            {mockTechnicians.map((t) => (
              <option key={t} value={t}>
                {t}
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

      {/* Tabela de Resultados */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Data
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Horário
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Projeto / UM
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Técnico
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">
                  Escaneados
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">
                  Faltantes
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredConferences.length > 0 ? (
                filteredConferences.map((conf) => (
                  <tr key={conf.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {new Date(conf.date).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td className="p-3">
                      {conf.startTime} - {conf.endTime}
                    </td>
                    <td className="p-3">
                      {conf.project} / {conf.um}
                    </td>
                    <td className="p-3">{conf.technician}</td>
                    <td className="p-3 text-center text-green-600 font-semibold">
                      {conf.scanned}
                    </td>
                    <td className="p-3 text-center text-red-600 font-semibold">
                      {conf.missing}
                    </td>
                    <td className="p-3 text-center font-bold">
                      {conf.expected}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center p-6 text-gray-500">
                    Nenhum resultado encontrado para os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
