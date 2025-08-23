"use client";

import React from "react";
import { LucideIcon, Info } from "lucide-react";
import { AppButton } from "./AppButton";

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
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-slate-600 dark:text-zinc-300">
            {title}
          </h3>
          <div className="bg-teal-100 p-2 rounded-lg dark:bg-teal-900/50">
            <Icon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
        </div>
        <p className="text-4xl font-bold text-slate-900 dark:text-zinc-100 mt-4">
          {value}
        </p>
      </div>
      {onDetailsClick && (
        <div className="flex justify-end mt-4">
          <AppButton onClick={onDetailsClick} variant="primary" size="sm">
            <Info size={16} className="mr-1.5" />
            Detalhes
          </AppButton>
        </div>
      )}
    </div>
  );
}
