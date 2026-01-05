import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

interface NumberRangeSliderProps {
  value: [number, number]
  onChange: (value: [number, number]) => void
  min?: number
  max?: number
  step?: number
}

export function NumberRangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: NumberRangeSliderProps) {
  const handleBlur = (index: 0 | 1) => {
    const val = value[index]
    const clamped = Math.min(Math.max(val, min), max)
    const stepped = Math.round(clamped / step) * step
    
    if (stepped !== val) {
      const newValue: [number, number] = [...value]
      newValue[index] = stepped
      
      // Ensure min is not greater than max
      if (index === 0 && stepped > value[1]) {
        newValue[1] = stepped
      } else if (index === 1 && stepped < value[0]) {
        newValue[0] = stepped
      }
      
      onChange(newValue)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={value[0]}
          onChange={(e) => onChange([Number(e.target.value), value[1]])}
          onBlur={() => handleBlur(0)}
          onKeyDown={(e) => e.key === "Enter" && handleBlur(0)}
          className="h-8 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ width: `${Math.max(String(value[0]).length + 3, 6)}ch` }}
          min={min}
          max={max}
          step={step}
        />
        
        <div className="flex-1 space-y-1.5 mt-2">
          <Slider
            value={value}
            onValueChange={(vals) => onChange([vals[0], vals[1]])}
            min={min}
            max={max}
            step={step}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
            <span>Min: {min}</span>
            <span>Max: {max}</span>
          </div>
        </div>

        <Input
          type="number"
          value={value[1]}
          onChange={(e) => onChange([value[0], Number(e.target.value)])}
          onBlur={() => handleBlur(1)}
          onKeyDown={(e) => e.key === "Enter" && handleBlur(1)}
          className="h-8 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ width: `${Math.max(String(value[1]).length + 3, 6)}ch` }}
          min={min}
          max={max}
          step={step}
        />
      </div>
    </div>
  )
}

