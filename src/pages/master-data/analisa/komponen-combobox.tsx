import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { KomponenAnalisa } from "@/types/master"

function komponenLabel(item: KomponenAnalisa) {
  return `${item.kode} - ${item.uraian} (${item.lokasi ?? "-"} ${item.tahun ?? ""})`
}

interface KomponenComboboxProps {
  items: KomponenAnalisa[]
  value: number
  onChange: (id: number) => void
  placeholder: string
}

// Pilih komponen harga satuan dengan pencarian (daftar bisa panjang: semua kode × lokasi × tahun).
export function KomponenCombobox({ items, value, onChange, placeholder }: KomponenComboboxProps) {
  const [open, setOpen] = useState(false)
  const terpilih = items.find((item) => item.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !terpilih && "text-muted-foreground")}>
            {terpilih ? komponenLabel(terpilih) : placeholder}
          </span>
          <ChevronsUpDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(32rem,90vw)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari kode, uraian, lokasi..." />
          <CommandList className="max-h-72">
            <CommandEmpty>Komponen tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${komponenLabel(item)} #${item.id}`}
                  onSelect={() => {
                    onChange(item.id)
                    setOpen(false)
                  }}
                >
                  <Check className={cn(item.id === value ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 truncate">{komponenLabel(item)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatMoney(item.harga)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
