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
import { ArrowUpDown, History } from "lucide-react";
import { AppButton } from "./AppButton";
import { MaintenanceNotebook } from "@/types";

interface TabelaManutencaoProps {
  data: MaintenanceNotebook[];
  openHistoryModal: (notebook: MaintenanceNotebook) => void;
}

const columns: ColumnDef<MaintenanceNotebook>[] = [
  {
    accessorKey: "hostname",
    header: ({ column }) => (
      <AppButton
        variant="ghost"
        size="sm"
        className="!p-1 !font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Hostname
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </AppButton>
    ),
    cell: (info) => <div className="font-mono">{info.getValue<string>()}</div>,
  },
  {
    accessorKey: "serialNumber",
    header: "S/N",
    cell: (info) => info.getValue() || "-",
  },
  {
    accessorKey: "assetTag",
    header: "Patrimônio",
    cell: (info) => info.getValue() || "-",
  },
  {
    accessorKey: "maintenanceStartDate",
    header: ({ column }) => (
      <div className="text-center">
        <AppButton
          variant="ghost"
          size="sm"
          className="!p-1 !font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data de Envio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </AppButton>
      </div>
    ),
    cell: ({ row }) => {
      const date = row.original.maintenanceStartDate?.toDate();
      return (
        <div className="text-center">
          {date ? date.toLocaleDateString("pt-BR") : "-"}
        </div>
      );
    },
  },
  {
    id: "acoes",
    header: () => <div className="text-center">Ações</div>,
    cell: ({ row, table }) => {
      const openHistoryModal = table.options.meta?.openHistoryModal;

      if (!openHistoryModal) return null;

      return (
        <div className="text-center">
          <AppButton
            onClick={() => openHistoryModal(row.original)}
            variant="ghost"
            size="icon"
            title="Ver Histórico do Ativo"
            className="data-[hover]:text-blue-600"
          >
            <History size={18} />
          </AppButton>
        </div>
      );
    },
  },
];

export function TabelaManutencao({
  data,
  openHistoryModal,
}: TabelaManutencaoProps) {
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
      openHistoryModal,
    },
  });

  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-100">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} className="p-2 font-semibold text-slate-600">
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
          <tr key={row.id} className="border-b">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="p-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
