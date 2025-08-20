"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppButton } from "./AppButton"; // ADICIONADO

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex justify-end items-center text-sm space-x-2">
      <AppButton
        onClick={handlePrev}
        disabled={currentPage === 1}
        variant="secondary"
        size="sm"
        className="!bg-white !border !border-slate-300 !text-slate-700 data-[hover]:!bg-slate-100 !font-normal"
      >
        <ChevronLeft size={16} className="mr-1" />
        Anterior
      </AppButton>

      <span className="px-2 text-slate-600">
        Página {currentPage} de {totalPages}
      </span>

      <AppButton
        onClick={handleNext}
        disabled={currentPage === totalPages}
        variant="secondary"
        size="sm"
        className="!bg-white !border !border-slate-300 !text-slate-700 data-[hover]:!bg-slate-100 !font-normal"
      >
        Próximo
        <ChevronRight size={16} className="ml-1" />
      </AppButton>
    </div>
  );
}
