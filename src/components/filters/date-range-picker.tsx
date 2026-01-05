import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  date: DateRange
  setDate: (date: DateRange) => void
  minDate?: Date
  maxDate?: Date
}

export function DateRangePicker({ date, setDate, minDate, maxDate }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={"w-full justify-start text-left font-normal h-9"}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL. do, yyyy")}{" - "}
                {format(date.to, "LLL. do, yyyy")}
              </>
            ) : (
              format(date.from, "LLL. do, yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          required
          defaultMonth={date.from}
          selected={date}
          captionLayout="dropdown"
          startMonth={minDate || new Date(1900, 0)}
          endMonth={maxDate || new Date(2100, 11)}
          disabled={[
            minDate ? { before: minDate } : false,
            maxDate ? { after: maxDate } : false,
          ].filter((x): x is { before: Date } | { after: Date } => !!x)}
          onSelect={setDate}
        />
      </PopoverContent>
    </Popover>
  )
}

