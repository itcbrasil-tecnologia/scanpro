"use client";

import React, { useState, useEffect, useCallback, Fragment } from "react";
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
import { Download, X, Check, ChevronsUpDown } from "lucide-react";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { PeripheralsModal } from "@/components/ui/PeripheralsModal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { ConferenceData } from "@/types";
import { Listbox, Transition } from "@headlessui/react";
import { AppButton } from "@/components/ui/AppButton";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { DateRange } from "react-day-picker";
import { TabelaRelatorios } from "@/components/ui/TabelaRelatorios";
import { RowSelectionState } from "@tanstack/react-table";

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
  dateRange: DateRange | undefined;
}

const ITEMS_PER_PAGE = 15;

export default function ReportsPage() {
  const [conferences, setConferences] = useState<ConferenceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPeripheralsModalOpen, setIsPeripheralsModalOpen] = useState(false);
  const [selectedPeripherals, setSelectedPeripherals] =
    useState<Partial<ConferenceData> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ums, setUms] = useState<UM[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filters, setFilters] = useState<Filters>({
    projectId: "",
    umId: "",
    technicianId: "",
    dateRange: undefined,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const fetchFilterData = useCallback(async () => {
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
      setUms(umsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UM)));
      setTechnicians(
        techniciansSnap.docs.map(
          (doc) => ({ uid: doc.id, nome: doc.data().nome } as Technician)
        )
      );
    } catch (error) {
      console.error("Erro ao buscar dados para filtros:", error);
      toast.error("Não foi possível carregar as opções de filtro.");
    }
  }, []);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  const fetchConferences = useCallback(
    async (
      page: number,
      startingAfter?: QueryDocumentSnapshot<DocumentData> | null,
      currentFilters?: Filters
    ) => {
      setIsLoading(true);
      const activeFilters = currentFilters || filters;
      try {
        const conferencesRef = collection(db, "conferences");
        const queryConstraints: QueryConstraint[] = [];

        if (activeFilters.projectId) {
          const projectDoc = projects.find(
            (p) => p.id === activeFilters.projectId
          );
          if (projectDoc)
            queryConstraints.push(where("projectName", "==", projectDoc.name));
        }

        if (activeFilters.umId) {
          const umDoc = ums.find((u) => u.id === activeFilters.umId);
          if (umDoc) queryConstraints.push(where("umName", "==", umDoc.name));
        }

        if (activeFilters.technicianId) {
          queryConstraints.push(
            where("userId", "==", activeFilters.technicianId)
          );
        }

        if (activeFilters.dateRange?.from) {
          queryConstraints.push(
            where(
              "endTime",
              ">=",
              Timestamp.fromDate(activeFilters.dateRange.from)
            )
          );
        }

        if (activeFilters.dateRange?.to) {
          const endOfDay = new Date(activeFilters.dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          queryConstraints.push(
            where("endTime", "<=", Timestamp.fromDate(endOfDay))
          );
        }

        const countQuery = query(conferencesRef, ...queryConstraints);
        const countSnapshot = await getDocs(countQuery);
        setTotalPages(Math.ceil(countSnapshot.size / ITEMS_PER_PAGE));

        const dataQueryConstraints: QueryConstraint[] = [
          ...queryConstraints,
          orderBy("endTime", "desc"),
          limit(ITEMS_PER_PAGE),
        ];
        if (page > 1 && startingAfter) {
          dataQueryConstraints.push(startAfter(startingAfter));
        }

        const dataQuery = query(conferencesRef, ...dataQueryConstraints);
        const documentSnapshots = await getDocs(dataQuery);
        const conferenceData = documentSnapshots.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as ConferenceData)
        );
        setConferences(conferenceData);
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
    [projects, ums, filters]
  );

  useEffect(() => {
    if (projects.length > 0 && ums.length > 0) {
      setCurrentPage(1);
      setLastVisible(null);
      fetchConferences(1, null, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, projects, ums]);

  const handlePageChange = (newPage: number) => {
    if (newPage > currentPage && lastVisible) {
      fetchConferences(newPage, lastVisible);
    } else if (newPage < currentPage) {
      fetchConferences(1, null);
    }
  };

  const handleFilterChange = (
    name: keyof Omit<Filters, "dateRange">,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setFilters((prev) => ({ ...prev, dateRange: range }));
  };

  const handleClearFilters = () => {
    setFilters({
      projectId: "",
      umId: "",
      technicianId: "",
      dateRange: undefined,
    });
  };

  const generateAndDownloadCSV = (
    dataToExport: ConferenceData[],
    fileName: string
  ) => {
    if (dataToExport.length === 0) {
      toast.error("Nenhum dado para exportar.", { id: "export-toast" });
      return;
    }

    toast.loading("Exportando dados...", { id: "export-toast" });
    const formattedData = dataToExport.map((data) => ({
      Data: data.endTime.toDate().toLocaleDateString("pt-BR"),
      Inicio: data.startTime.toDate().toLocaleTimeString("pt-BR"),
      Fim: data.endTime.toDate().toLocaleTimeString("pt-BR"),
      Projeto: data.projectName,
      UM: data.umName,
      Tecnico: data.userName,
      Esperados: data.expectedCount,
      Escaneados: data.scannedCount,
      Faltantes: data.missingCount,
      Mouses: data.miceCount ?? 0,
      Carregadores: data.chargersCount ?? 0,
      "Fones de Ouvido": data.headsetsCount ?? 0,
    }));
    const csvData = Papa.unparse(formattedData);
    const blob = new Blob([`\uFEFF${csvData}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório exportado com sucesso!", { id: "export-toast" });
  };

  const handleExportAllCSV = () => {
    generateAndDownloadCSV(conferences, "relatorio_completo_scanpro.csv");
  };

  const handleExportSelectedCSV = () => {
    const selectedIndexes = Object.keys(rowSelection).map(Number);
    const selectedData = conferences.filter((_, index) =>
      selectedIndexes.includes(index)
    );
    generateAndDownloadCSV(selectedData, "relatorio_selecionado_scanpro.csv");
  };

  const openPeripheralsModal = (data: Partial<ConferenceData>) => {
    setSelectedPeripherals(data);
    setIsPeripheralsModalOpen(true);
  };

  const filteredUms = filters.projectId
    ? ums.filter((um) => um.projectId === filters.projectId)
    : ums;

  const getProjectName = (id: string) =>
    projects.find((p) => p.id === id)?.name || "Todos os Projetos";
  const getUmName = (id: string) =>
    ums.find((u) => u.id === id)?.name || "Todas as UMs";
  const getTechnicianName = (id: string) =>
    technicians.find((t) => t.uid === id)?.nome || "Todos os Técnicos";

  const numSelected = Object.keys(rowSelection).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-zinc-100">
          Relatórios de Conferências
        </h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          {numSelected > 0 ? (
            <AppButton
              onClick={handleExportSelectedCSV}
              variant="primary"
              size="sm"
            >
              <Download size={16} className="mr-2" />
              Exportar {numSelected} Selecionado(s)
            </AppButton>
          ) : (
            <AppButton onClick={handleExportAllCSV} variant="success" size="sm">
              <Download size={16} className="mr-2" /> Exportar Tudo
            </AppButton>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md space-y-4 dark:bg-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Listbox
            value={filters.projectId}
            onChange={(value) => handleFilterChange("projectId", value)}
          >
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600">
                <span className="block truncate">
                  {getProjectName(filters.projectId)}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10 dark:bg-zinc-900 dark:ring-zinc-700">
                  <Listbox.Option
                    value=""
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active
                          ? "bg-teal-100 text-teal-900 dark:bg-zinc-700"
                          : "text-gray-900 dark:text-zinc-200"
                      }`
                    }
                  >
                    Todos os Projetos
                  </Listbox.Option>
                  {projects.map((p) => (
                    <Listbox.Option
                      key={p.id}
                      value={p.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active
                            ? "bg-teal-100 text-teal-900 dark:bg-zinc-700"
                            : "text-gray-900 dark:text-zinc-200"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {p.name}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>

          <Listbox
            value={filters.umId}
            onChange={(value) => handleFilterChange("umId", value)}
          >
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600">
                <span className="block truncate">
                  {getUmName(filters.umId)}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10 dark:bg-zinc-900 dark:ring-zinc-700">
                  <Listbox.Option
                    value=""
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active
                          ? "bg-teal-100 text-teal-900 dark:bg-zinc-700"
                          : "text-gray-900 dark:text-zinc-200"
                      }`
                    }
                  >
                    Todas as UMs
                  </Listbox.Option>
                  {filteredUms.map((u) => (
                    <Listbox.Option
                      key={u.id}
                      value={u.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active
                            ? "bg-teal-100 text-teal-900 dark:bg-zinc-700"
                            : "text-gray-900 dark:text-zinc-200"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {u.name}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>

          <Listbox
            value={filters.technicianId}
            onChange={(value) => handleFilterChange("technicianId", value)}
          >
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600">
                <span className="block truncate">
                  {getTechnicianName(filters.technicianId)}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10 dark:bg-zinc-900 dark:ring-zinc-700">
                  <Listbox.Option
                    value=""
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active
                          ? "bg-teal-100 text-teal-900 dark:bg-zinc-700"
                          : "text-gray-900 dark:text-zinc-200"
                      }`
                    }
                  >
                    Todos os Técnicos
                  </Listbox.Option>
                  {technicians.map((t) => (
                    <Listbox.Option
                      key={t.uid}
                      value={t.uid}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active
                            ? "bg-teal-100 text-teal-900 dark:bg-zinc-700"
                            : "text-gray-900 dark:text-zinc-200"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {t.nome}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>

          <div className="lg:col-span-1">
            <DateRangePicker
              range={filters.dateRange}
              setRange={handleDateRangeChange}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <AppButton onClick={handleClearFilters} variant="secondary" size="sm">
            <X size={16} className="mr-2" /> Limpar Filtros
          </AppButton>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden dark:bg-zinc-800">
        {isLoading ? (
          <p className="text-center text-gray-500 p-6 dark:text-zinc-400">
            Carregando relatórios...
          </p>
        ) : conferences.length > 0 ? (
          <TabelaRelatorios
            data={conferences}
            openPeripheralsModal={openPeripheralsModal}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
          />
        ) : (
          <p className="text-center text-gray-500 p-6 dark:text-zinc-400">
            Nenhum resultado encontrado para os filtros selecionados.
          </p>
        )}
        <div className="p-4 border-t flex justify-between items-center dark:border-zinc-700">
          <div className="text-sm text-slate-600 dark:text-zinc-300">
            {Object.keys(rowSelection).length} de {conferences.length} linha(s)
            selecionada(s).
          </div>
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
