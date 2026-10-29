import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { tenderService } from "@/services/tender-service"
import type { PekerjaanOption } from "@/types/tender"

interface PekerjaanComboboxProps {
  idLocation: string | null
  value: PekerjaanOption | null
  onChange: (value: PekerjaanOption | null) => void
  // Nama item yang sedang diisi: hasil diurutkan menurut kemiripan & diberi nomor (quick count).
  itemName?: string
  placeholder?: string
}

// Cari pekerjaan bank data (per lokasi proyek) langsung ke backend, 20 per halaman.
export function PekerjaanCombobox({
  idLocation,
  value,
  onChange,
  itemName,
  placeholder = "Pilih item...",
}: PekerjaanComboboxProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState("")
  const debouncedTerm = useDebounce(term, 300)
  const [hasil, setHasil] = useState<{ key: string; data: PekerjaanOption[]; more: boolean; page: number }>({
    key: "",
    data: [],
    more: false,
    page: 1,
  })
  const kunci = `${debouncedTerm}|${idLocation}|${itemName ?? ""}`
  const loading = open && hasil.key !== kunci

  useEffect(() => {
    if (!open) return
    let aktif = true
    tenderService
      .searchPekerjaan(debouncedTerm, idLocation, 1, itemName)
      .then((res) => aktif && setHasil({ key: kunci, data: res.data, more: res.more, page: 1 }))
      .catch(() => aktif && setHasil({ key: kunci, data: [], more: false, page: 1 }))
    return () => {
      aktif = false
    }
  }, [open, debouncedTerm, idLocation, itemName, kunci])

  function muatLagi() {
    const page = hasil.page + 1
    tenderService
      .searchPekerjaan(debouncedTerm, idLocation, page, itemName)
      .then((res) =>
        setHasil((prev) =>
          prev.key === kunci ? { ...prev, data: [...prev.data, ...res.data], more: res.more, page } : prev
        )
      )
  }

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
          <span className={cn("truncate", !value && "text-muted-foreground")} title={value?.nama}>
            {value ? value.nama : placeholder}
          </span>
          <ChevronsUpDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(36rem,90vw)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={term} onValueChange={setTerm} placeholder="Cari nama pekerjaan..." />
          <CommandList className="max-h-80">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Mencari...
              </div>
            ) : (
              <CommandEmpty>Pekerjaan tidak ditemukan.</CommandEmpty>
            )}
            {!loading && (
              <CommandGroup>
                {value && (
                  <CommandItem
                    value="__hapus__"
                    onSelect={() => {
                      onChange(null)
                      setOpen(false)
                    }}
                    className="text-muted-foreground"
                  >
                    Kosongkan pilihan
                  </CommandItem>
                )}
                {hasil.data.map((item, i) => (
                  <CommandItem
                    key={`${item.id}-${item.project}-${i}`}
                    value={`${item.id}|${item.project}|${i}`}
                    onSelect={() => {
                      onChange(item)
                      setOpen(false)
                    }}
                    className="items-start"
                  >
                    <Check className={cn("mt-0.5", value?.id === item.id ? "opacity-100" : "opacity-0")} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate">
                          {itemName !== undefined && <span className="text-muted-foreground">{i + 1}. </span>}
                          {item.nama}
                        </span>
                        {item.kategori === "subkon" && (
                          <Badge variant="outline" className="border-amber-300 text-amber-700">
                            subkon
                          </Badge>
                        )}
                      </div>
                      {item.project && <p className="truncate text-xs text-muted-foreground">{item.project}</p>}
                    </div>
                  </CommandItem>
                ))}
                {hasil.more && (
                  <CommandItem value="__lagi__" onSelect={muatLagi} className="justify-center text-muted-foreground">
                    Muat lebih banyak...
                  </CommandItem>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
