import { Loader2, Plus, Save, X } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney } from "@/lib/format"
import { KomponenCombobox } from "@/pages/master-data/analisa/komponen-combobox"
import { lokasiLabel } from "@/pages/master-data/use-master-options"
import { apiErrorMessage } from "@/services/api"
import { masterService } from "@/services/master-service"
import { TIPE_HARGA, type FormAnalisaData, type KomponenAnalisa } from "@/types/master"

interface AnalisaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Kosong = buat analisa baru, terisi = edit analisa itu.
  analisaId?: string
  onSaved: () => void
}

// Dipasang ulang (key baru) setiap dibuka: data form selalu diambil ulang dari backend.
export function AnalisaFormDialog({ open, onOpenChange, analisaId, onSaved }: AnalisaFormDialogProps) {
  const [data, setData] = useState<FormAnalisaData | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let aktif = true
    masterService
      .formAnalisa(analisaId)
      .then((res) => aktif && setData(res))
      .catch((err) => aktif && setError(apiErrorMessage(err, "Gagal membuka form analisa")))
    return () => {
      aktif = false
    }
  }, [analisaId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92svh] flex-col gap-0 p-0 sm:max-w-6xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{data?.analisa ? `Edit Analisa: ${data.analisa.kode}` : "Buat Analisa"}</DialogTitle>
        </DialogHeader>
        {data ? (
          <AnalisaForm data={data} onCancel={() => onOpenChange(false)} onSaved={onSaved} />
        ) : (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground">
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : (
              <>
                <Loader2 className="size-4 animate-spin" />
                Memuat form analisa...
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface BarisForm {
  key: number
  id: number // 0 = belum pilih komponen
  coeff: string
}

let nextKey = 1
const barisBaru = (id = 0, coeff = "0"): BarisForm => ({ key: nextKey++, id, coeff })

// 8.5 -> "8.5", 1 -> "1" (maks 4 desimal, tanpa nol di belakang).
const formatKoef = (nilai: number) => String(Number(nilai.toFixed(4)))

// Koefisien: hanya angka dan satu titik desimal (koma otomatis jadi titik).
const bersihkanKoef = (nilai: string) =>
  nilai
    .replace(",", ".")
    .replace(/[^0-9.]/g, "")
    .replace(/^(\d*\.\d*).*$/, "$1")

const rupiah = (nilai: number) => `Rp ${formatMoney(nilai)}`

function AnalisaForm({ data, onCancel, onSaved }: { data: FormAnalisaData; onCancel: () => void; onSaved: () => void }) {
  const analisa = data.analisa
  // Seksi: Material, Upah, Alat, Subkontraktor, lalu tipe lain yang ada di database.
  const seksi = [...TIPE_HARGA, ...Object.keys(data.komponen).filter((t) => !TIPE_HARGA.includes(t as never))]

  const [uraian, setUraian] = useState(analisa?.nama ?? "")
  const [satuan, setSatuan] = useState(analisa?.unit ?? "")
  const [tahun, setTahun] = useState(() => String(analisa?.tahun ?? new Date().getFullYear()))
  const [lokasi, setLokasi] = useState(analisa?.lokasi_id ?? "")
  const [keterangan, setKeterangan] = useState(analisa?.keterangan ?? "")
  const [baris, setBaris] = useState<Record<string, BarisForm[]>>(() =>
    Object.fromEntries(
      seksi.map((tipe) => [tipe, (data.baris[tipe] ?? []).map((b) => barisBaru(b.id, formatKoef(b.coeff)))])
    )
  )
  const [saving, setSaving] = useState(false)

  const komponenById = new Map<number, KomponenAnalisa>()
  for (const tipe of seksi) for (const item of data.komponen[tipe] ?? []) komponenById.set(item.id, item)

  const subtotalBaris = (b: BarisForm) => (parseFloat(b.coeff) || 0) * (komponenById.get(b.id)?.harga ?? 0)
  const subtotalSeksi = (tipe: string) => (baris[tipe] ?? []).reduce((sum, b) => sum + subtotalBaris(b), 0)
  const total = seksi.reduce((sum, tipe) => sum + subtotalSeksi(tipe), 0)

  function ubahBaris(tipe: string, key: number, patch: Partial<BarisForm>) {
    setBaris((prev) => ({ ...prev, [tipe]: prev[tipe].map((b) => (b.key === key ? { ...b, ...patch } : b)) }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!lokasi) {
      toast.error("Pilih lokasi analisa.")
      return
    }
    setSaving(true)
    try {
      const res = await masterService.simpanAnalisa({
        id: analisa?.id,
        uraian,
        satuan,
        tahun: Number(tahun),
        lokasi,
        keterangan,
        komponen: seksi.flatMap((tipe) => baris[tipe].map((b) => ({ tipe, id: b.id, koefisien: b.coeff }))),
      })
      if (res.success) {
        toast.success(res.message)
        onCancel()
        onSaved()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal menyimpan analisa"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 md:grid-cols-[160px_1fr_180px]">
          <div className="space-y-2">
            <Label htmlFor="analisaKode">Kode</Label>
            <Input id="analisaKode" value={data.kode} readOnly className="bg-muted font-semibold" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="analisaUraian">Uraian Pekerjaan</Label>
            <Input id="analisaUraian" value={uraian} onChange={(e) => setUraian(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="analisaSatuan">Satuan</Label>
            <Input
              id="analisaSatuan"
              value={satuan}
              onChange={(e) => setSatuan(e.target.value)}
              placeholder="M3, M2, Kg"
              required
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[160px_240px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="analisaTahun">Tahun</Label>
            <Input
              id="analisaTahun"
              type="number"
              min={2000}
              max={2100}
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Lokasi</Label>
            <Select value={lokasi} onValueChange={setLokasi}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih lokasi" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {data.lokasi.map((l) => (
                  <SelectItem key={l.kode} value={l.kode}>
                    {lokasiLabel(l)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="analisaKeterangan">Keterangan</Label>
            <Input
              id="analisaKeterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Proyek / dokumen sumber"
            />
          </div>
        </div>

        {seksi.map((tipe, i) => {
          const huruf = String.fromCharCode(65 + i)
          const daftar = data.komponen[tipe] ?? []
          return (
            <section key={tipe} className="overflow-hidden rounded-lg border">
              <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
                <h3 className="text-sm font-semibold">
                  {huruf}. {tipe}
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title={`Tambah baris ${tipe}`}
                  onClick={() => setBaris((prev) => ({ ...prev, [tipe]: [...prev[tipe], barisBaru()] }))}
                >
                  <Plus />
                </Button>
              </div>
              <Table className="min-w-250 table-fixed text-[13px]">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-16" />
                  <col className="w-16" />
                  <col />
                  <col className="w-28" />
                  <col className="w-20" />
                  <col className="w-36" />
                  <col className="w-36" />
                  <col className="w-12" />
                </colgroup>
                <TableHeader>
                  <TableRow className="text-xs uppercase">
                    <TableHead className="pl-4">Komponen</TableHead>
                    <TableHead className="text-center">Tahun</TableHead>
                    <TableHead className="text-center">Lokasi</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Koefisien</TableHead>
                    <TableHead className="text-center">Satuan</TableHead>
                    <TableHead className="text-right">Harga Satuan (Rp)</TableHead>
                    <TableHead className="text-right">Subtotal (Rp)</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {baris[tipe].length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-4 text-center text-muted-foreground">
                        Belum ada komponen {tipe}. Klik + untuk menambah.
                      </TableCell>
                    </TableRow>
                  )}
                  {baris[tipe].map((b) => {
                    const k = komponenById.get(b.id)
                    return (
                      <TableRow key={b.key}>
                        <TableCell className="pl-4">
                          <KomponenCombobox
                            items={daftar}
                            value={b.id}
                            onChange={(id) => ubahBaris(tipe, b.key, { id })}
                            placeholder={`Pilih ${tipe}...`}
                          />
                        </TableCell>
                        <TableCell className="text-center">{k?.tahun ?? "-"}</TableCell>
                        <TableCell className="text-center">{k ? (k.lokasi ?? "-") : lokasi || "-"}</TableCell>
                        <TableCell className="truncate text-muted-foreground" title={k?.keterangan ?? undefined}>
                          {k?.keterangan || "-"}
                        </TableCell>
                        <TableCell>
                          <Input
                            inputMode="decimal"
                            autoComplete="off"
                            aria-label={`Koefisien ${k?.kode ?? tipe}`}
                            value={b.coeff}
                            onChange={(e) => ubahBaris(tipe, b.key, { coeff: bersihkanKoef(e.target.value) })}
                            className="text-right tabular-nums"
                          />
                        </TableCell>
                        <TableCell className="text-center">{k?.satuan ?? "-"}</TableCell>
                        <TableCell className="text-right tabular-nums">{rupiah(k?.harga ?? 0)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{rupiah(subtotalBaris(b))}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            title="Hapus baris"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setBaris((prev) => ({ ...prev, [tipe]: prev[tipe].filter((x) => x.key !== b.key) }))}
                          >
                            <X />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={7} className="text-right">
                      Subtotal {huruf}. {tipe}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{rupiah(subtotalSeksi(tipe))}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </section>
          )
        })}

        <div className="flex items-center justify-between rounded-lg bg-primary px-5 py-4 text-primary-foreground">
          <span className="text-sm font-semibold tracking-wide">TOTAL ANALISA</span>
          <span className="text-lg font-bold tabular-nums">{rupiah(total)}</span>
        </div>
      </div>

      <DialogFooter className="m-0 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          Simpan
        </Button>
      </DialogFooter>
    </form>
  )
}
