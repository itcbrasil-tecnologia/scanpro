"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  onDetailsClick?: () => void;
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  onDetailsClick,
}: DashboardCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
          {/* Usando a cor 'teal' padrão do Tailwind para o ícone */}
          <div className="bg-teal-100 p-2 rounded-lg">
            <Icon className="h-6 w-6 text-teal-600" />
          </div>
        </div>
        <p className="text-4xl font-bold text-gray-900 mt-4">{value}</p>
      </div>
      {onDetailsClick && (
        <div className="flex justify-end mt-4">
          <button
            onClick={onDetailsClick}
            // MUDANÇA: Usando 'teal-600' e padding ajustado para um botão menor
            className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded-md transition-colors"
          >
            Detalhes
          </button>
        </div>
      )}
    </div>
  );
}
