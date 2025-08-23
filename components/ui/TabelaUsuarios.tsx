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
import { UserProfile } from "@/types";
import { ArrowUpDown, Edit, Trash2 } from "lucide-react";
import { AppButton } from "./AppButton";

interface TabelaUsuariosProps {
  data: UserProfile[];
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
}

const roleColor: Record<UserProfile["role"], string> = {
  MASTER:
    "bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  ADMIN: "bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  USER: "bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300",
};

const columns: ColumnDef<UserProfile>[] = [
  {
    accessorKey: "nome",
    header: ({ column }) => (
      <AppButton
        variant="ghost"
        size="sm"
        className="!p-1 !font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nome
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </AppButton>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "whatsapp",
    header: "Whatsapp",
    cell: (info) => info.getValue() || "-",
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <AppButton
        variant="ghost"
        size="sm"
        className="!p-1 !font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Perfil
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </AppButton>
    ),
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 text-xs font-bold rounded-full ${
          roleColor[row.original.role]
        }`}
      >
        {row.original.role}
      </span>
    ),
  },
  {
    id: "acoes",
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row, table }) => {
      const { onEdit, onDelete } = table.options.meta || {};
      return (
        <div className="flex items-center justify-end space-x-3">
          {onEdit && (
            <AppButton
              onClick={() => onEdit(row.original)}
              variant="ghost"
              size="icon"
              className="bg-slate-100 data-[hover]:bg-slate-200 dark:bg-zinc-700/50 dark:data-[hover]:bg-zinc-700"
            >
              <Edit size={20} />
            </AppButton>
          )}
          {onDelete && (
            <AppButton
              onClick={() => onDelete(row.original)}
              variant="ghost"
              size="icon"
              className="data-[hover]:text-red-600 bg-slate-100 data-[hover]:bg-slate-200 dark:bg-zinc-700/50 dark:data-[hover]:bg-zinc-700"
            >
              <Trash2 size={20} />
            </AppButton>
          )}
        </div>
      );
    },
  },
];

export function TabelaUsuarios({
  data,
  onEdit,
  onDelete,
}: TabelaUsuariosProps) {
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
      onEdit,
      onDelete,
    },
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-200 rounded-t-lg dark:bg-black/20">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-3 font-semibold text-slate-700 first:rounded-tl-lg last:rounded-tr-lg dark:text-zinc-300"
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
                <td key={cell.id} className="p-3">
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
