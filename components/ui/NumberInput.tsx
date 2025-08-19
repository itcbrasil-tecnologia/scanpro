"use client";

import { Minus, Plus } from "lucide-react";
import React from "react";

interface NumberInputProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (max === undefined || value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
    if (!isNaN(numValue)) {
      if (numValue < min) {
        onChange(min);
      } else if (max !== undefined && numValue > max) {
        onChange(max);
      } else {
        onChange(numValue);
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-x-4">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-700 transition-colors hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Diminuir quantidade"
      >
        <Minus className="h-6 w-6" />
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleInputChange}
        className="h-16 w-24 rounded-lg border-2 border-slate-300 bg-slate-50 text-center text-3xl font-bold text-slate-800 focus:border-teal-500 focus:ring-teal-500"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={max !== undefined && value >= max}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-700 transition-colors hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Aumentar quantidade"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};
