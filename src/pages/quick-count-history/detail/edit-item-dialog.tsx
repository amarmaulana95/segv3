import { Loader2, Save } from "lucide-react"
import { useState, type FormEvent } from "react"
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
import { formatAngka, parseAngka } from "@/lib/format"
import { apiErrorMessage } from "@/services/api"
import { tenderService } from "@/services/tender-service"
import type { EstimasiItem } from "@/types/tender"

interface EditItemDialogProps {
  projectUuid: string
  item: EstimasiItem | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

// Dipasang ulang (key = id item) setiap dibuka, jadi state awal cukup dari props.
export function EditItemDialog({ projectUuid, item, onOpenChange, onSaved }: EditItemDialogProps) {
  const [unit, setUnit] = useState(item?.unit ?? "")
  const [volume, setVolume] = useState(formatAngka(item?.volume, 2))
  const [adj, setAdj] = useState(formatAngka(item?.adj, 2))
  const [harga, setHarga] = useState(formatAngka(item?.price_ref, 0))
  const [saving, setSaving] = useState(false)

  const total = parseAngka(volume) * (parseAngka(adj) || 1) * parseAngka(harga)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!item) return
    setSaving(true)
    try {
      const res = await tenderService.updateItem(projectUuid, item.id, {
        nama_pekerjaan: item.nama_pekerjaan ?? "",
        unit,
        volume: parseAngka(volume),
        adj: parseAngka(adj),
        price_ref: parseAngka(harga),
      })
      if (res.success) {
        toast.success(res.message)
        onOpenChange(false)
        onSaved()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal menyimpan item"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Pekerjaan</Label>
            <Input value={item?.nama_pekerjaan ?? ""} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editUnit">Unit</Label>
            <Input id="editUnit" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editVolume">Volume</Label>
              <Input
                id="editVolume"
                inputMode="decimal"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="text-right tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAdj">Adj</Label>
              <Input
                id="editAdj"
                inputMode="decimal"
                value={adj}
                onChange={(e) => setAdj(e.target.value)}
                className="text-right tabular-nums"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editHarga">Ref. Harga</Label>
            <Input
              id="editHarga"
              inputMode="decimal"
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              className="text-right tabular-nums"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Format angka Indonesia: titik = ribuan, koma = desimal (mis. 1.250,50).
          </p>
          <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm">
            <span className="font-medium">Total</span>
            <span className="font-mono font-semibold tabular-nums">Rp {formatAngka(total)}</span>
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
