import { Download, Upload } from "lucide-react"
import { useState, type FormEvent } from "react"

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
import type { PreviewResult } from "@/types/tender"

const MAKS_UKURAN = 5 * 1024 * 1024

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Hasil gagal terakhir dari backend (ditampilkan di dialog); null = belum ada.
  gagal: PreviewResult | null
  sedangProses: boolean
  onUpload: (file: File) => void
}

export function UploadDialog({ open, onOpenChange, gagal, sedangProses, onUpload }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [pesanLokal, setPesanLokal] = useState("")

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    if (file.size > MAKS_UKURAN) {
      setPesanLokal("Ukuran file maksimal 5 MB.")
      return
    }
    setPesanLokal("")
    onUpload(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Unggah File</DialogTitle>
          <DialogDescription>
            Unggah file Excel (.xlsx) sesuai template. Baris pertama adalah judul kolom.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Button asChild variant="link" className="h-auto px-0">
            <a href="/templates/template-quick-count.xlsx" download="template-quick-count.xlsx">
              <Download />
              Unduh template
            </a>
          </Button>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <strong>Perhatian:</strong> untuk <b>HEADER / KELOMPOK PEKERJAAN</b>, kolom A wajib huruf kapital diikuti
            tanda titik <code className="rounded bg-amber-100 px-1">( . )</code>, contoh{" "}
            <code className="rounded bg-amber-100 px-1">A.</code> <code className="rounded bg-amber-100 px-1">B.</code>{" "}
            <code className="rounded bg-amber-100 px-1">B1.</code>
          </div>

          <img
            src="/images/contoh-format-quick-count.png"
            alt="Contoh format header kelompok pekerjaan"
            className="w-full rounded-lg border"
          />

          <div className="space-y-2">
            <Label htmlFor="fileQuickCount">File Excel (.xlsx, maks 5 MB)</Label>
            <Input
              id="fileQuickCount"
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={sedangProses}
              required
            />
          </div>

          {(pesanLokal || gagal) && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {pesanLokal || gagal?.message}
              {!!gagal?.errors?.length && !pesanLokal && (
                <ul className="mt-2 max-h-48 list-disc space-y-0.5 overflow-auto pl-5">
                  {gagal.errors.map((err) => (
                    <li key={`${err.baris}-${err.kolom}`}>{err.pesan}</li>
                  ))}
                </ul>
              )}
              {!!gagal?.contoh?.length && !pesanLokal && (
                <p className="mt-2">
                  Contoh header yang benar:{" "}
                  {gagal.contoh.map((c) => (
                    <code key={c} className="mr-1 rounded bg-destructive/10 px-1">
                      {c}
                    </code>
                  ))}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={!file || sedangProses}>
              <Upload />
              Unggah
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
