"use client";

import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import { ConferenceData } from "@/types";
import { ArrowUpDown, Eye, FileText, TriangleAlert } from "lucide-react";
import { AppButton } from "./AppButton";

interface TabelaHistoricoProps {
  data: ConferenceData[];
  openDetailsModal: (hostnames: string[]) => void;
  openPeripheralsModal: (data: Partial<ConferenceData>) => void;
  openSummaryModal: (conference: ConferenceData) => void;
}

const columns: ColumnDef<ConferenceData>[] = [
  {
    accessorKey: "endTime",
    header: ({ column }) => (
      <AppButton
        variant="ghost"
        size="sm"
        className="!p-1 !font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Data
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </AppButton>
    ),
    cell: ({ row }) => {
      const date = row.original.endTime.toDate();
      const startTime = row.original.startTime.toDate();
      return (
        <div>
          <p>{date.toLocaleDateString("pt-BR")}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            {startTime.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            -{" "}
            {date.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "umName",
    header: ({ column }) => (
      <AppButton
        variant="ghost"
        size="sm"
        className="!p-1 !font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        UM
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </AppButton>
    ),
  },
  {
    id: "contagem",
    header: () => <div className="text-center">Contagem</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.scannedCount} / {row.original.expectedCount}
      </div>
    ),
  },
  {
    id: "perifericos",
    header: () => <div className="text-center">Periféricos</div>,
    cell: ({ row, table }) => {
      const { openPeripheralsModal } = table.options.meta || {};
      const { miceCount, chargersCount, headsetsCount } = row.original;
      const hasPeripherals =
        miceCount !== undefined ||
        chargersCount !== undefined ||
        headsetsCount !== undefined;

      if (!hasPeripherals || !openPeripheralsModal) return null;
      return (
        <div className="text-center">
          <AppButton
            onClick={() => openPeripheralsModal(row.original)}
            size="sm"
            className="!text-xs !font-semibold !text-teal-800 !bg-teal-100 data-[hover]:!bg-teal-200 !px-3 !py-1 !rounded-full !shadow-none dark:!bg-teal-900/50 dark:!text-teal-300 dark:data-[hover]:!bg-teal-800/50"
          >
            <Eye size={14} className="mr-1.5" /> Ver
          </AppButton>
        </div>
      );
    },
  },
  {
    id: "status",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const isComplete =
        row.original.scannedCount === row.original.expectedCount;
      const style = isComplete
        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
        : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      return (
        <div className="text-center">
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${style}`}>
            {isComplete ? "CONCLUÍDO" : "INCOMPLETO"}
          </span>
        </div>
      );
    },
  },
  {
    id: "detalhes",
    header: () => <div className="text-center">Detalhes</div>,
    cell: ({ row, table }) => {
      const { openDetailsModal } = table.options.meta || {};
      if (row.original.missingCount === 0 || !openDetailsModal) return null;
      return (
        <div className="text-center">
          <AppButton
            size="sm"
            className="!text-xs !font-semibold !bg-amber-100 !text-amber-800 data-[hover]:!bg-amber-200 !rounded-full !px-3 !py-1 !shadow-none dark:!bg-amber-900/50 dark:!text-amber-300 dark:data-[hover]:!bg-amber-800/50"
            onClick={() => openDetailsModal(row.original.missingDevices)}
          >
            <TriangleAlert size={14} className="mr-1.5" /> Ver Faltantes
          </AppButton>
        </div>
      );
    },
  },
  {
    id: "resumo",
    header: () => <div className="text-center">Resumo</div>,
    cell: ({ row, table }) => {
      const { openSummaryModal } = table.options.meta || {};
      if (!openSummaryModal) return null;
      return (
        <div className="text-center">
          <AppButton
            size="sm"
            className="!text-xs !font-semibold !bg-blue-100 !text-blue-800 data-[hover]:!bg-blue-200 !rounded-full !px-3 !py-1 !shadow-none dark:!bg-blue-900/50 dark:!text-blue-300 dark:data-[hover]:!bg-blue-800/50"
            onClick={() => openSummaryModal(row.original)}
          >
            <FileText size={14} className="mr-1.5" /> Ver Resumo
          </AppButton>
        </div>
      );
    },
  },
];

export function TabelaHistorico({
  data,
  openDetailsModal,
  openPeripheralsModal,
  openSummaryModal,
}: TabelaHistoricoProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      openDetailsModal,
      openPeripheralsModal,
      openSummaryModal,
    },
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-200 border-b-2 border-slate-300 rounded-t-lg dark:bg-zinc-800 dark:border-zinc-700">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-3 text-sm font-semibold text-slate-600 first:rounded-tl-lg last:rounded-tr-lg dark:text-zinc-300"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-700/50"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-3 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
