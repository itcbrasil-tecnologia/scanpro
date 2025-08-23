"use client";

import React, { Dispatch, SetStateAction, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  ColumnDef,
  RowSelectionState,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { ConferenceData } from "@/types";
import { ArrowUpDown, Eye } from "lucide-react";
import { AppButton } from "./AppButton";

interface TabelaRelatoriosProps {
  data: ConferenceData[];
  openPeripheralsModal: (data: Partial<ConferenceData>) => void;
  rowSelection: RowSelectionState;
  setRowSelection: Dispatch<SetStateAction<RowSelectionState>>;
}

const columns: ColumnDef<ConferenceData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 dark:bg-zinc-700 dark:border-zinc-600 dark:checked:bg-teal-500"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(value) =>
          table.toggleAllPageRowsSelected(!!value.target.checked)
        }
        aria-label="Selecionar todas as linhas"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 dark:bg-zinc-700 dark:border-zinc-600 dark:checked:bg-teal-500"
        checked={row.getIsSelected()}
        onChange={(value) => row.toggleSelected(!!value.target.checked)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
      return <div>{date.toLocaleDateString("pt-BR")}</div>;
    },
  },
  {
    id: "horario",
    header: "Horário",
    cell: ({ row }) => {
      const startTime = row.original.startTime.toDate();
      const endTime = row.original.endTime.toDate();
      return (
        <div>
          {startTime.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          -{" "}
          {endTime.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
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
    accessorKey: "scannedCount",
    header: () => <div className="text-center">Escaneados</div>,
    cell: (info) => (
      <div className="text-center">{info.getValue<number>()}</div>
    ),
  },
  {
    accessorKey: "missingCount",
    header: () => <div className="text-center">Faltantes</div>,
    cell: (info) => (
      <div className="text-center">{info.getValue<number>()}</div>
    ),
  },
  {
    id: "perifericos",
    header: () => <div className="text-center">Periféricos</div>,
    cell: ({ row, table }) => {
      const openPeripheralsModal = table.options.meta?.openPeripheralsModal;
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
            <Eye size={14} className="mr-1.5" />
            Visualizar
          </AppButton>
        </div>
      );
    },
  },
  {
    accessorKey: "expectedCount",
    header: () => <div className="text-center">Total</div>,
    cell: (info) => (
      <div className="text-center font-bold">{info.getValue<number>()}</div>
    ),
  },
];

export function TabelaRelatorios({
  data,
  openPeripheralsModal,
  rowSelection,
  setRowSelection,
}: TabelaRelatoriosProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    meta: {
      openPeripheralsModal,
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
                  className="p-3 text-sm font-semibold text-gray-800 first:rounded-tl-lg last:rounded-tr-lg dark:text-zinc-300"
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
              className="border-b hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-700/50 data-[state=selected]:bg-teal-50 dark:data-[state=selected]:bg-teal-900/40"
              data-state={row.getIsSelected() && "selected"}
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
