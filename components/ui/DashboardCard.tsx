// components/ui/DashboardCard.tsx
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
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
        <div className="bg-indigo-100 p-2 rounded-lg">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-4xl font-bold text-gray-900">{value}</p>
        {onDetailsClick && (
          <button
            onClick={onDetailsClick}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 mt-2"
          >
            Detalhes
          </button>
        )}
      </div>
    </div>
  );
}
