import { Download, Loader2, Upload } from "lucide-react"
import { useState, type FormEvent } from "react"

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
import { MAKS_UKURAN_IMPOR, prosesUpload, type ProsesImpor } from "@/lib/impor"
import { apiErrorMessage } from "@/services/api"
import { masterService } from "@/services/master-service"
import type { ImporResult } from "@/types/master"

interface AnalisaImporDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Dipanggil setelah impor berhasil (tabel & filter dimuat ulang).
  onImported: () => void
}

export function AnalisaImporDialog({ open, onOpenChange, onImported }: AnalisaImporDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [proses, setProses] = useState<ProsesImpor | null>(null)
  const loading = proses !== null
  const [hasil, setHasil] = useState<ImporResult | null>(null)

  async function handleImpor(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    if (file.size > MAKS_UKURAN_IMPOR) {
      setHasil({ success: false, message: "Ukuran file maksimal 100 MB." })
      return
    }
    setProses(prosesUpload(file.name, 0))
    setHasil(null)
    try {
      const res = await masterService.imporAnalisa(file, (persen) => setProses(prosesUpload(file.name, persen)))
      setHasil(res)
      if (res.success) onImported()
    } catch (err) {
      setHasil({ success: false, message: apiErrorMessage(err, "Gagal mengimpor file") })
    } finally {
      setProses(null)
    }
  }

  // Selama proses berjalan dialog tidak bisa ditutup supaya user tidak mengira impor batal.
  function handleOpenChange(next: boolean) {
    if (!next && loading) return
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl" showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>Impor Analisa</DialogTitle>
          <DialogDescription>
            Kunci unik Kode × Lokasi × Tahun. Kode, lokasi &amp; tahun yang sudah ada akan diganti seluruh uraiannya.
            Isi sesuai template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleImpor} className="space-y-4">
          <Button asChild variant="link" className="h-auto px-0">
            <a href={masterService.templateAnalisaUrl} download="template-analisa.xlsx">
              <Download />
              Unduh template
            </a>
          </Button>

          <div className="space-y-2">
            <Label htmlFor="fileImporAnalisa">File Excel (.xlsx, maks 100 MB)</Label>
            <Input
              id="fileImporAnalisa"
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={loading}
              required
            />
          </div>

          {proses && <ImporProgress proses={proses} />}

          {hasil && <ImporHasilAlert hasil={hasil} />}

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
