import { Loader2, Save } from "lucide-react"
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
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { lokasiLabel } from "@/pages/master-data/use-master-options"
import { masterService } from "@/services/master-service"
import { TIPE_HARGA, type HargaSatuan, type Lokasi, type MasterKomponen } from "@/types/master"

const KOMPONEN_BARU = "__baru__"

export type HargaFormMode =
  | { type: "add" }
  | { type: "edit"; row: HargaSatuan }
  | { type: "copy"; row: HargaSatuan }

interface HargaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: HargaFormMode
  komponen: MasterKomponen[]
  lokasi: Lokasi[]
  onSaved: () => void
}

// Dipasang ulang (key baru) setiap dibuka, jadi state awal cukup dihitung dari props.
export function HargaFormDialog({ open, onOpenChange, mode, komponen, lokasi, onSaved }: HargaFormDialogProps) {
  const row = mode.type === "add" ? null : mode.row

  const [kodeKomponen, setKodeKomponen] = useState(row?.kode ?? "")
  const [uraianBaru, setUraianBaru] = useState("")
  const [satuanBaru, setSatuanBaru] = useState("")
  const [tipeBaru, setTipeBaru] = useState<string>(TIPE_HARGA[0])
  const [kodeBaru, setKodeBaru] = useState("")
  const [lokasiDipilih, setLokasiDipilih] = useState(
    (mode.type === "edit" ? row?.lokasi : null) ?? lokasi[0]?.kode ?? ""
  )
  const [tahun, setTahun] = useState(() =>
    String((mode.type === "edit" ? row?.tahun : null) ?? new Date().getFullYear())
  )
  const [harga, setHarga] = useState(mode.type === "edit" ? String(row?.price ?? "") : "")
  const [keterangan, setKeterangan] = useState(mode.type === "edit" ? (row?.keterangan ?? "") : "")
  const [saving, setSaving] = useState(false)

  const isBaru = kodeKomponen === KOMPONEN_BARU
  const terpilih = komponen.find((k) => k.kode === kodeKomponen)

  // Pratinjau kode komponen baru sesuai tipe; kode final tetap dibuat backend saat simpan.
  useEffect(() => {
    if (!isBaru) return
    let aktif = true
    masterService
      .kodeHargaBaru(tipeBaru)
      .then((kode) => aktif && setKodeBaru(kode))
      .catch(() => aktif && setKodeBaru(""))
    return () => {
      aktif = false
    }
  }, [isBaru, tipeBaru])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!kodeKomponen) {
      toast.error("Pilih komponen terlebih dahulu.")
      return
    }
    setSaving(true)
    try {
      const res = await masterService.simpanHarga({
        id_lama: mode.type === "edit" ? mode.row.id : undefined,
        kode_komponen: kodeKomponen,
        uraian_baru: isBaru ? uraianBaru : undefined,
        satuan_baru: isBaru ? satuanBaru : undefined,
        tipe_baru: isBaru ? tipeBaru : undefined,
        lokasi: lokasiDipilih,
        tahun: Number(tahun),
        harga,
        keterangan,
      })
      if (res.success) {
        toast.success(res.message)
        onOpenChange(false)
        onSaved()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Gagal menyimpan data. Periksa koneksi ke server.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode.type === "edit" ? `Edit Harga: ${mode.row.kode}` : "Tambah Harga"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Kode Komponen</Label>
            <Select value={kodeKomponen} onValueChange={setKodeKomponen}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih komponen" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value={KOMPONEN_BARU}>+ Komponen Baru...</SelectItem>
                <SelectSeparator />
                {komponen.map((k) => (
                  <SelectItem key={k.kode} value={k.kode}>
                    {k.kode} - {k.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isBaru && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kode Baru</Label>
                <Input value={kodeBaru} readOnly placeholder="A0014" className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uraianBaru">Uraian</Label>
                <Input
                  id="uraianBaru"
                  value={uraianBaru}
                  onChange={(e) => setUraianBaru(e.target.value)}
                  placeholder="Nama komponen"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="satuanBaru">Satuan</Label>
                <Input
                  id="satuanBaru"
                  value={satuanBaru}
                  onChange={(e) => setSatuanBaru(e.target.value)}
                  placeholder="M3, Kg, Zak"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select value={tipeBaru} onValueChange={setTipeBaru}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPE_HARGA.map((tipe) => (
                      <SelectItem key={tipe} value={tipe}>
                        {tipe}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {terpilih && (
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div className="space-y-2">
                <Label>Uraian</Label>
                <Input value={terpilih.nama} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Satuan</Label>
                <Input value={terpilih.unit} readOnly className="bg-muted" />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Select value={lokasiDipilih} onValueChange={setLokasiDipilih}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {lokasi.map((l) => (
                    <SelectItem key={l.kode} value={l.kode}>
                      {lokasiLabel(l)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tahunHarga">Tahun Survei</Label>
              <Input
                id="tahunHarga"
                type="number"
                min={2000}
                max={2100}
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nilaiHarga">Harga (Rp)</Label>
            <Input
              id="nilaiHarga"
              type="number"
              min={0}
              step="0.01"
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              placeholder="Masukkan harga"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keteranganHarga">Keterangan</Label>
            <Textarea
              id="keteranganHarga"
              rows={3}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Sumber survei / catatan vendor"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
