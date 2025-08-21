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
import { ArrowUpDown, FileText, MapPin } from "lucide-react";
import { AppButton } from "./AppButton";

interface TabelaConferenciasProps {
  data: ConferenceData[];
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
          <p className="text-xs text-gray-500">
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
    accessorKey: "projectName",
    header: ({ column }) => (
      <AppButton
        variant="ghost"
        size="sm"
        className="!p-1 !font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Projeto / UM
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </AppButton>
    ),
    cell: ({ row }) => (
      <div>
        {row.original.projectName} / {row.original.umName}
      </div>
    ),
  },
  {
    accessorKey: "userName",
    header: ({ column }) => (
      <AppButton
        variant="ghost"
        size="sm"
        className="!p-1 !font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Técnico
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
    id: "status",
    // CORREÇÃO: Adicionada a accessorFn para que a tabela saiba o que ordenar
    accessorFn: (row) => row.scannedCount === row.expectedCount,
    header: ({ column }) => (
      <div className="flex justify-center">
        <AppButton
          variant="ghost"
          size="sm"
          className="!p-1 !font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </AppButton>
      </div>
    ),
    cell: ({ row }) => {
      const isComplete =
        row.original.scannedCount === row.original.expectedCount;
      const style = isComplete
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";
      return (
        <div className="text-center">
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${style}`}>
            {isComplete ? "CONCLUÍDO" : "INCOMPLETO"}
          </span>
        </div>
      );
    },
    // A sortingFn customizada foi removida, pois a biblioteca sabe ordenar booleanos nativamente
  },
  {
    id: "localidade",
    header: () => <div className="text-center">Localidade</div>,
    cell: ({ row }) => {
      const { latitude, longitude } = row.original;
      if (!latitude || !longitude) return null;
      return (
        <div className="flex justify-center">
          <a
            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 hover:underline font-semibold flex items-center"
          >
            <MapPin size={14} className="mr-1" /> Link
          </a>
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
            className="!text-xs !font-semibold !bg-blue-100 !text-blue-800 data-[hover]:!bg-blue-200 !rounded-full !px-3 !py-1 !shadow-none"
            onClick={() => openSummaryModal(row.original)}
          >
            <FileText size={14} className="mr-1.5" /> Ver
          </AppButton>
        </div>
      );
    },
  },
];

export default function TabelaConferencias({
  data,
  openSummaryModal,
}: TabelaConferenciasProps) {
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
      openSummaryModal,
    },
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-200 border-b-2 border-slate-300 rounded-t-lg">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-3 text-sm font-semibold text-slate-600 first:rounded-tl-lg last:rounded-tr-lg"
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
            <tr key={row.id} className="border-b hover:bg-slate-50">
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
