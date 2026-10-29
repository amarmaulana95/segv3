import { useState, type ComponentProps } from "react"

import { Input } from "@/components/ui/input"
import { formatAngka } from "@/lib/format"
import { cn } from "@/lib/utils"

interface AngkaInputProps extends Omit<ComponentProps<typeof Input>, "value" | "onChange"> {
  value: number
  onValueChange: (value: number) => void
  desimal?: number
}

// Input rupiah format Indonesia: saat diketik hanya angka & satu koma (maks `desimal` digit),
// saat tidak fokus tampil berformat ribuan (mis. 1.250.000,00).
export function AngkaInput({ value, onValueChange, desimal = 2, className, ...props }: AngkaInputProps) {
  const [teks, setTeks] = useState<string | null>(null)

  return (
    <Input
      {...props}
      inputMode="decimal"
      autoComplete="off"
      className={cn("text-right tabular-nums", className)}
      value={teks ?? formatAngka(value, desimal)}
      onFocus={(e) => {
        setTeks(value ? formatAngka(value, desimal).replace(/\./g, "") : "")
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        setTeks(null)
        props.onBlur?.(e)
      }}
      onChange={(e) => {
        let val = e.target.value.replace(/[^0-9,]/g, "")
        const [bulat, ...sisa] = val.split(",")
        if (sisa.length) val = `${bulat},${sisa.join("").slice(0, desimal)}`
        setTeks(val)
        onValueChange(parseFloat(val.replace(",", ".")) || 0)
      }}
    />
  )
}
