"use client";

import React, { Fragment, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, Transition } from "@headlessui/react";
import { Calendar as CalendarIcon } from "lucide-react";
import { AppButton } from "./AppButton";

interface DateRangePickerProps {
  range: DateRange | undefined;
  setRange: (range: DateRange | undefined) => void;
}

// Objeto de estilos para o teste final
const calendarStyles = {
  day: {
    borderRadius: "100%",
  },
  selected: {
    backgroundColor: "#0d9488", // Cor Teal do ScanPRO
    color: "white",
  },
  today: {
    color: "#0d9488", // Cor Teal do ScanPRO
    fontWeight: "bold",
  },
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  range,
  setRange,
}) => {
  const [month, setMonth] = useState<Date>(range?.from || new Date());

  const handleClear = () => {
    setRange(undefined);
  };

  const handleGoToToday = () => {
    setMonth(new Date());
    setRange({ from: new Date(), to: new Date() });
  };

  const footer = (
    <div className="flex justify-end items-center p-2 border-t mt-2 space-x-2">
      <AppButton onClick={handleGoToToday} variant="ghost" size="sm">
        Hoje
      </AppButton>
      <AppButton onClick={handleClear} variant="secondary" size="sm">
        Limpar
      </AppButton>
    </div>
  );

  return (
    <Popover className="relative">
      <Popover.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <span className="pl-6 text-sm">
          {range?.from ? (
            range.to ? (
              <>
                {format(range.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                {format(range.to, "dd/MM/yy", { locale: ptBR })}
              </>
            ) : (
              format(range.from, "dd/MM/yy", { locale: ptBR })
            )
          ) : (
            <span>Selecione um período</span>
          )}
        </span>
      </Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute right-0 z-10 mt-1 w-auto bg-white border rounded-md shadow-lg p-3">
          <DayPicker
            initialFocus
            mode="range"
            month={month}
            onMonthChange={setMonth}
            selected={range}
            onSelect={setRange}
            locale={ptBR}
            numberOfMonths={2}
            footer={footer}
            styles={calendarStyles} // Usando a prop `styles`
            modifiersClassNames={{
              selected: "font-bold", // Mantemos a classe para o texto em negrito
            }}
          />
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
