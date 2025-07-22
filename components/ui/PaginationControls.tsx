"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  onNext: () => void;
  onPrev: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isLoading: boolean;
}

export function PaginationControls({
  onNext,
  onPrev,
  hasNextPage,
  hasPrevPage,
  isLoading,
}: PaginationControlsProps) {
  const buttonStyle =
    "px-3 py-1 border rounded-md flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const enabledStyle = "hover:bg-slate-100";
  const disabledStyle = "bg-slate-50 text-slate-400";

  return (
    <div className="flex justify-end items-center mt-4 text-sm space-x-2">
      <button
        onClick={onPrev}
        disabled={!hasPrevPage || isLoading}
        className={`${buttonStyle} ${
          !hasPrevPage ? disabledStyle : enabledStyle
        }`}
      >
        <ChevronLeft size={16} className="mr-1" />
        Anterior
      </button>
      <button
        onClick={onNext}
        disabled={!hasNextPage || isLoading}
        className={`${buttonStyle} ${
          !hasNextPage ? disabledStyle : enabledStyle
        }`}
      >
        Próximo
        <ChevronRight size={16} className="ml-1" />
      </button>
    </div>
  );
}
