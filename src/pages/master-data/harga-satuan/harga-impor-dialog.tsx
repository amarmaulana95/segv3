import { Download, Loader2, Upload } from "lucide-react"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { ImporHasilAlert, ImporProgress } from "@/components/common/impor-feedback"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney } from "@/lib/format"
import { lokasiLabel } from "@/pages/master-data/use-master-options"
import { MAKS_UKURAN_IMPOR, prosesUpload, type ProsesImpor } from "@/lib/impor"
import { apiErrorMessage } from "@/services/api"
import { masterService } from "@/services/master-service"
import type { ImporResult, KonflikImpor, Lokasi } from "@/types/master"

interface HargaImporDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lokasi: Lokasi[]
  // Dipanggil setiap ada data yang tersimpan (tabel dimuat ulang).
  onImported: () => void
}

export function HargaImporDialog({ open, onOpenChange, lokasi, onImported }: HargaImporDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [proses, setProses] = useState<ProsesImpor | null>(null)
  const loading = proses !== null
  const [hasil, setHasil] = useState<ImporResult | null>(null)
  // Baris yang uraiannya sudah ada di lokasi & tahun yang sama: bisa diedit lalu dikirim ulang tanpa unggah file lagi.
  const [konflik, setKonflik] = useState<KonflikImpor[]>([])

  function tampilHasil(res: ImporResult, rowsDikirim?: KonflikImpor[]) {
    setHasil(res)
    if (res.success) {
      setKonflik(res.konflik ?? [])
      onImported()
    } else if (rowsDikirim) {
      // Gagal simpan ulang: baris tetap ditampilkan supaya bisa diperbaiki lagi.
      setKonflik(rowsDikirim)
    }
  }

  async function handleImpor(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    if (file.size > MAKS_UKURAN_IMPOR) {
      setHasil({ success: false, message: "Ukuran file maksimal 100 MB." })
      return
    }
    setProses(prosesUpload(file.name, 0))
    setHasil(null)
    setKonflik([])
    try {
      tampilHasil(await masterService.imporHarga(file, (persen) => setProses(prosesUpload(file.name, persen))))
    } catch (err) {
      setHasil({ success: false, message: apiErrorMessage(err, "Gagal mengimpor file") })
    } finally {
      setProses(null)
    }
  }

  async function handleSimpanUlang() {
    const rows = konflik
    setProses({ tahap: "proses", persen: 100, pesan: `Menyimpan ulang ${rows.length} baris, mohon tunggu...` })
    try {
      tampilHasil(await masterService.imporHargaUlang(rows), rows)
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal menyimpan ulang data"))
    } finally {
      setProses(null)
    }
  }

  // Selama proses berjalan dialog tidak bisa ditutup supaya user tidak mengira impor batal.
  function handleOpenChange(next: boolean) {
    if (!next && loading) return
    onOpenChange(next)
  }

  function ubahKonflik(index: number, patch: Partial<KonflikImpor>) {
    setKonflik((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl" showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>Impor Harga Satuan</DialogTitle>
          <DialogDescription>
            Kode dibuat otomatis. Uraian yang sudah ada di lokasi &amp; tahun yang sama tidak diunggah dan bisa
            diganti namanya di sini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleImpor} className="space-y-4">
          <Button asChild variant="link" className="h-auto px-0">
            <a href={masterService.templateHargaUrl} download="template-harga-satuan.xlsx">
              <Download />
              Unduh template
            </a>
          </Button>

          <div className="space-y-2">
            <Label htmlFor="fileImporHarga">File Excel (.xlsx, maks 100 MB)</Label>
            <Input
              id="fileImporHarga"
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={loading}
              required
            />
          </div>

          {proses && <ImporProgress proses={proses} />}

          {hasil && <ImporHasilAlert hasil={hasil} />}

          {konflik.length > 0 && (
            <div className="overflow-hidden rounded-lg border">
              <div className="border-b bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                Tidak diunggah ({konflik.length} baris) — ganti uraian, lokasi, atau tahunnya lalu simpan ulang
              </div>
              <div className="max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Baris</TableHead>
                      <TableHead>Uraian</TableHead>
                      <TableHead className="w-44">Lokasi</TableHead>
                      <TableHead className="w-24">Tahun</TableHead>
                      <TableHead className="w-32 text-right">Harga</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {konflik.map((row, i) => (
                      <TableRow key={row.baris} className="align-top">
                        <TableCell className="pt-4">{row.baris}</TableCell>
                        <TableCell className="whitespace-normal">
                          <Input value={row.uraian} onChange={(e) => ubahKonflik(i, { uraian: e.target.value })} />
                          <p className="mt-1 text-xs text-destructive">{row.pesan}</p>
                        </TableCell>
                        <TableCell>
                          <Select value={row.lokasi} onValueChange={(value) => ubahKonflik(i, { lokasi: value })}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                              {lokasi.map((l) => (
                                <SelectItem key={l.kode} value={l.kode}>
                                  {lokasiLabel(l)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={2000}
                            max={2100}
                            value={row.tahun}
                            onChange={(e) => ubahKonflik(i, { tahun: Number(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell className="pt-4 text-right font-mono tabular-nums">
                          {formatMoney(row.harga)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end border-t px-3 py-2">
                <Button type="button" size="sm" onClick={handleSimpanUlang} disabled={loading}>
                  Simpan Ulang
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Tutup
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? <Loader2 className="animate-spin" /> : <Upload />}
              {loading ? "Mengimpor..." : "Impor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
