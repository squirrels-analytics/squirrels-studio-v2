import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SingleSelectProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SingleSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
}: SingleSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
