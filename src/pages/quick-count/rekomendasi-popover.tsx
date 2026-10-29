import { Check, ChevronDown } from "lucide-react"
import { useState } from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatAngka, formatSatuan } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { RekomendasiAnalisa } from "@/types/tender"

interface RekomendasiPopoverProps {
  list: RekomendasiAnalisa[]
  dipakaiId: string | null // id pekerjaan yang sedang dipakai baris ini
  hargaRef: number
  onPilih: (rek: RekomendasiAnalisa) => void
}

// Rekomendasi analisa AHSP untuk satu baris: selisih harga dibanding harga referensi yang sedang dipakai.
export function RekomendasiPopover({ list, dipakaiId, hargaRef, onPilih }: RekomendasiPopoverProps) {
  const [open, setOpen] = useState(false)
  if (!list.length) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`Rekomendasi analisa (${list.length} Opsi Alternatif Tersedia)`}
          className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg bg-blue-600 px-2.5 py-1.5 text-left text-xs font-medium text-white hover:bg-blue-700"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {/* Titik penanda seperti .rek-dot simseg: lingkaran putih bercincin biru muda. */}
            <span className="size-3 shrink-0 rounded-full bg-white shadow-[inset_0_0_0_3px_#93b4f5]" />
            <span className="truncate">Rekomendasi analisa · {list.length} opsi</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-blue-900/60 px-1.5 py-0.5">
            {open ? "Tutup" : "Buka"}
            <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(32rem,90vw)] p-1" align="start">
        <ul className="max-h-72 overflow-auto">
          {list.map((rek) => {
            const dipakai = rek.id === dipakaiId
            const persen = hargaRef > 0 && !dipakai ? Math.round(((rek.total - hargaRef) / hargaRef) * 100) : null
            return (
              <li key={rek.id}>
                <button
                  type="button"
                  disabled={dipakai}
                  onClick={() => {
                    onPilih(rek)
                    setOpen(false)
                  }}
                  className="flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-default disabled:bg-blue-50"
                  title={`AHSP ${rek.kode}`}
                >
                  <span className="flex min-w-0 items-start gap-2">
                    <Check className={cn("mt-0.5 size-4 shrink-0 text-blue-700", !dipakai && "invisible")} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {rek.kode} - {rek.nama}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Tahun {rek.tahun ?? "-"} · kemiripan {Math.round(rek.score * 100)}%
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs">
                    <span className="block font-mono font-semibold tabular-nums">
                      Rp {formatAngka(rek.total, 2)}
                      {rek.unit && ` / ${formatSatuan(rek.unit)}`}
                    </span>
                    {persen !== null && (
                      <span className={cn(persen > 0 ? "text-destructive" : "text-emerald-700")}>
                        ({persen > 0 ? "+" : ""}
                        {persen}%)
                      </span>
                    )}
                    {dipakai && <span className="text-blue-700">Dipakai</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
