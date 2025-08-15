"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded-md flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
      >
        <ChevronLeft size={16} className="mr-1" />
        Anterior
      </button>
      <span className="px-2 text-slate-600">
        Página {currentPage} de {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border rounded-md flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
      >
        Próximo
        <ChevronRight size={16} className="ml-1" />
      </button>
    </div>
  );
}
