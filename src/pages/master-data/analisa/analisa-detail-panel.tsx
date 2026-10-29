import { Loader2 } from "lucide-react"
import { Fragment, useEffect, useState } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney } from "@/lib/format"
import { apiErrorMessage } from "@/services/api"
import { masterService } from "@/services/master-service"
import { TIPE_HARGA, type AnalisaDetail } from "@/types/master"

// Rincian dikelompokkan per tipe: urutan Material, Upah, Alat, Subkontraktor, lalu tipe lain.
function kelompokkan(data: AnalisaDetail[]) {
  const grup = new Map<string, AnalisaDetail[]>()
  for (const item of data) grup.set(item.tipe, [...(grup.get(item.tipe) ?? []), item])
  const urutan = [...TIPE_HARGA.filter((t) => grup.has(t)), ...[...grup.keys()].filter((t) => !TIPE_HARGA.includes(t as never))]
  return urutan.map((tipe) => {
    const items = grup.get(tipe) ?? []
    return { tipe, items, subtotal: items.reduce((sum, item) => sum + item.subtotal, 0) }
  })
}

export function AnalisaDetailPanel({ id }: { id: string }) {
  const [state, setState] = useState<{ data?: AnalisaDetail[]; error?: string }>({})

  useEffect(() => {
    let aktif = true
    masterService
      .detailAnalisa(id)
      .then((res) => {
        if (!aktif) return
        setState(res.success ? { data: res.data } : { error: res.message ?? "Gagal memuat rincian." })
      })
      .catch((err) => aktif && setState({ error: apiErrorMessage(err, "Gagal memuat rincian analisa") }))
    return () => {
      aktif = false
    }
  }, [id])

  return (
    <div className="border-l-[3.5rem] border-muted bg-background">
      {!state.data && !state.error && (
        <p className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat rincian...
        </p>
      )}
      {state.error && <p className="px-6 py-4 text-sm text-destructive">{state.error}</p>}
      {state.data && <DetailTable data={state.data} />}
    </div>
  )
}

function DetailTable({ data }: { data: AnalisaDetail[] }) {
  const grup = kelompokkan(data)
  const total = grup.reduce((sum, g) => sum + g.subtotal, 0)

  return (
    <Table className="text-[13px]">
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className="pl-6 text-xs uppercase">Kode</TableHead>
          <TableHead className="text-xs uppercase">Uraian</TableHead>
          <TableHead className="text-center text-xs uppercase">Tahun</TableHead>
          <TableHead className="text-center text-xs uppercase">Lokasi</TableHead>
          <TableHead className="text-xs uppercase">Keterangan</TableHead>
          <TableHead className="text-right text-xs uppercase">Koefisien</TableHead>
          <TableHead className="text-center text-xs uppercase">Satuan</TableHead>
          <TableHead className="text-right text-xs uppercase">Harga Satuan (Rp)</TableHead>
          <TableHead className="pr-6 text-right text-xs uppercase">Subtotal (Rp)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {grup.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} className="py-6 text-center text-muted-foreground">
              Belum ada komponen.
            </TableCell>
          </TableRow>
        )}
        {grup.map((g) => (
          <Fragment key={g.tipe}>
            <TableRow className="bg-muted/40 font-semibold hover:bg-muted/40">
              <TableCell colSpan={8} className="text-right">
                Subtotal {g.tipe}
              </TableCell>
              <TableCell className="pr-6 text-right tabular-nums">{formatMoney(g.subtotal)}</TableCell>
            </TableRow>
            {g.items.map((item, i) => (
              <TableRow key={`${item.kode}-${i}`}>
                <TableCell className="pl-6">{item.kode}</TableCell>
                <TableCell className="whitespace-normal">{item.nama || "-"}</TableCell>
                <TableCell className="text-center">{item.tahun || "-"}</TableCell>
                <TableCell className="text-center">{item.lokasi || "-"}</TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">{item.keterangan || "-"}</TableCell>
                <TableCell className="text-right tabular-nums">{item.coeff.toFixed(4)}</TableCell>
                <TableCell className="text-center">{item.unit || "-"}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(item.harga_satuan)}</TableCell>
                <TableCell className="pr-6 text-right tabular-nums">{formatMoney(item.subtotal)}</TableCell>
              </TableRow>
            ))}
          </Fragment>
        ))}
        {grup.length > 0 && (
          <TableRow className="border-t-2 border-foreground bg-muted/40 font-bold hover:bg-muted/40">
            <TableCell colSpan={8} className="text-right">
              TOTAL ANALISA
            </TableCell>
            <TableCell className="pr-6 text-right tabular-nums">{formatMoney(total)}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
