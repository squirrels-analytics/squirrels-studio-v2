import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date: Date
  setDate: (date: Date) => void
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({ date, setDate, minDate, maxDate}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(date, "PPP")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          captionLayout="dropdown"
          startMonth={minDate || new Date(1900, 0)}
          endMonth={maxDate || new Date(2100, 11)}
          disabled={[
            minDate ? { before: minDate } : false,
            maxDate ? { after: maxDate } : false,
          ].filter((x): x is { before: Date } | { after: Date } => !!x)}
          onSelect={(newDate) => {
            if (newDate) {
              setDate(newDate)
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

