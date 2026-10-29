import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface YearPickerProps {
  id?: string
  value: string // "" = belum dipilih
  onChange: (value: string) => void
  placeholder?: string
}

const awalDekade = (tahun: number) => Math.floor(tahun / 10) * 10

// Pilih tahun per dekade (seperti bootstrap-datepicker mode tahun di simseg): 12 kotak = tahun terakhir
// dekade sebelumnya, 10 tahun dekade ini, tahun pertama dekade berikutnya.
export function YearPicker({ id, value, onChange, placeholder = "Pilih tahun" }: YearPickerProps) {
  const [tahunIni] = useState(() => new Date().getFullYear())
  const [open, setOpen] = useState(false)
  const [dekade, setDekade] = useState(() => awalDekade(Number(value) || tahunIni))
  const daftar = Array.from({ length: 12 }, (_, i) => dekade - 1 + i)

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) setDekade(awalDekade(Number(value) || tahunIni))
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value && "text-muted-foreground")}>{value || placeholder}</span>
          <CalendarDays className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="flex items-center justify-between pb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Dekade sebelumnya"
            onClick={() => setDekade((d) => d - 10)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm font-semibold">
            {dekade}-{dekade + 9}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Dekade berikutnya"
            onClick={() => setDekade((d) => d + 10)}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {daftar.map((tahun) => {
            const dipilih = String(tahun) === value
            const luarDekade = tahun < dekade || tahun > dekade + 9
            return (
              <Button
                key={tahun}
                type="button"
                variant={dipilih ? "default" : "ghost"}
                aria-pressed={dipilih}
                onClick={() => {
                  onChange(String(tahun))
                  setOpen(false)
                }}
                className={cn(
                  "h-10 font-normal",
                  !dipilih && luarDekade && "text-muted-foreground",
                  !dipilih && tahun === tahunIni && "bg-muted font-semibold"
                )}
              >
                {tahun}
              </Button>
            )
          })}
        </div>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 w-full text-muted-foreground"
            onClick={() => {
              onChange("")
              setOpen(false)
            }}
          >
            <X />
            Kosongkan
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
