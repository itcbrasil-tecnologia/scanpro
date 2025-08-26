// Caminho: components/ui/DateRangePicker.tsx

"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  range: DateRange | undefined;
  setRange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({
  className,
  range,
  setRange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [localRange, setLocalRange] = React.useState<DateRange | undefined>(
    range
  );
  const [month, setMonth] = React.useState<Date>(range?.from || new Date());

  React.useEffect(() => {
    setLocalRange(range);
  }, [range]);

  const handleApply = () => {
    setRange(localRange);
    setIsOpen(false);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(month);
    newDate.setFullYear(parseInt(year, 10));
    setMonth(newDate);
  };

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(month);
    newDate.setMonth(parseInt(monthIndex, 10));
    setMonth(newDate);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2020 + 1 },
    (_, i) => currentYear - i
  );
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !range && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {range?.from ? (
              range.to ? (
                <>
                  {format(range.from, "dd/MM/y", { locale: ptBR })} -{" "}
                  {format(range.to, "dd/MM/y", { locale: ptBR })}
                </>
              ) : (
                format(range.from, "dd/MM/y", { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex justify-between items-center gap-2 p-3 border-b">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMonth(new Date())}
              className="hover:bg-teal-100 dark:hover:bg-teal-900"
            >
              Hoje
            </Button>
            <div className="flex items-center gap-2">
              <Select
                onValueChange={handleMonthChange}
                value={String(month.getMonth())}
              >
                <SelectTrigger className="w-[120px] text-xs h-8">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {format(new Date(0, m), "MMMM", {
                        locale: ptBR,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={handleYearChange}
                value={String(month.getFullYear())}
              >
                <SelectTrigger className="w-[80px] text-xs h-8">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Calendar
            initialFocus
            month={month}
            onMonthChange={setMonth}
            mode="range"
            selected={localRange}
            onSelect={setLocalRange}
            numberOfMonths={2}
            locale={ptBR}
            footer={
              <div className="flex justify-end p-2 border-t mt-2 space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setLocalRange(undefined)}
                >
                  Limpar
                </Button>
                <Button size="sm" onClick={handleApply}>
                  Aplicar
                </Button>
              </div>
            }
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
