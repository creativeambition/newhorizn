"use client";

import { useState, useEffect } from "react";
import { format, startOfDay, isBefore } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRange {
  from?: Date | undefined;
  to?: Date | undefined;
}

interface DateRangePickerProps {
  range?: DateRange;
  onSelect?: (range?: DateRange) => void;
  disabled?: boolean;
  disableEnd?: boolean;
  bookedDates?: Date[];
  bufferDates?: Date[];
  disabledDates?: Date[];
}

export function DateRangePicker({ range, onSelect, disabled, disableEnd, bookedDates, bufferDates, disabledDates }: DateRangePickerProps) {
  const [internal, setInternal] = useState<DateRange | undefined>(range);
  const [isMobile, setIsMobile] = useState(false);
  const today = startOfDay(new Date());

  useEffect(() => {
    setInternal(range);
  }, [range]);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();

    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const label = () => {
    if (!internal || (!internal.from && !internal.to)) return <span>Pick date range</span>;
    if (internal.from && !internal.to) return <span>{format(internal.from, "PPP")}</span>;
    if (internal.from && internal.to)
      return <span>{`${format(internal.from, "MMM d")} - ${format(internal.to, "MMM d, yyyy")}`}</span>;
    return <span>Pick date range</span>;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !internal && "text-muted-foreground")}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label()}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)] overflow-auto" align="start">
        <Calendar
          mode={"range"}
          selected={internal && internal.from ? internal as any : undefined}
          onSelect={(r: any) => {
            const rawFrom: Date | undefined = r?.from;
            const from = rawFrom && isBefore(startOfDay(rawFrom), today) ? today : rawFrom;

            if (disableEnd) {
              const next: DateRange = { from };
              setInternal(next);
              onSelect?.(next);
              return;
            }

            const rawTo: Date | undefined = r?.to;
            const to = rawTo;

            const next: DateRange = { from, to };
            setInternal(next);
            onSelect?.(next);
          }}
          bookedDates={bookedDates}
          bufferDates={bufferDates}
          disabled={
            disabledDates ? [{ before: today } as any, ...disabledDates, ...(bookedDates || [])] : [{ before: today } as any, ...(bookedDates || [])]
          }
          numberOfMonths={isMobile ? 1 : 2}
        />
      </PopoverContent>
    </Popover>
  );
}