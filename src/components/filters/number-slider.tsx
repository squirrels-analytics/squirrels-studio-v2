import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

interface NumberSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export function NumberSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: NumberSliderProps) {
  const handleBlur = () => {
    const clamped = Math.min(Math.max(value, min), max)
    const stepped = Math.round(clamped / step) * step
    if (stepped !== value) {
      onChange(stepped)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1.5 mt-2">
          <Slider
            value={[value]}
            onValueChange={(vals) => onChange(vals[0])}
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
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && handleBlur()}
          className="h-8 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ width: `${Math.max(String(value).length + 3, 6)}ch` }}
          min={min}
          max={max}
          step={step}
        />
      </div>
    </div>
  )
}

