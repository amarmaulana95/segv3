import { ArrowLeft, Calculator, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { Fragment, useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROUTES } from "@/config/menu"
import { formatAngka, formatTanggal, parseAngka } from "@/lib/format"
import { EditItemDialog } from "@/pages/quick-count-history/detail/edit-item-dialog"
import { PekerjaanCombobox } from "@/components/tender/pekerjaan-combobox"
import { ApiError, apiErrorMessage, toQuery } from "@/services/api"
import { tenderService } from "@/services/tender-service"
import type { EstimasiItem, PekerjaanOption, ProjectDetailResult } from "@/types/tender"

// Header & item yang belum disimpan. headerId = id header lama (string) atau tempId header baru.
interface HeaderBaru {
  tempId: string
  nama: string
}

interface ItemBaru {
  key: number
  headerId: string
  nama: string
  unit: string
  pekerjaan: PekerjaanOption | null
  volume: string
  adj: string
  harga: string
  tahun: string
  memuatHarga: boolean
}

let nextKey = 1
const itemBaru = (headerId: string): ItemBaru => ({
  key: nextKey++,
  headerId,
  nama: "",
  unit: "",
  pekerjaan: null,
  volume: "1",
  adj: "1",
  harga: "",
  tahun: "",
  memuatHarga: false,
})

// Adj kosong/0 dianggap 1, sama seperti backend.
const amountBaru = (it: ItemBaru) => parseAngka(it.volume) * (parseAngka(it.adj) || 1) * parseAngka(it.harga)

const KOLOM = 11

export function ProjectDetailPage() {
  const { uuid = "" } = useParams()
  const [data, setData] = useState<{ key: number; result: ProjectDetailResult | null; error?: string } | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [headersBaru, setHeadersBaru] = useState<HeaderBaru[]>([])
  const [itemsBaru, setItemsBaru] = useState<ItemBaru[]>([])
  const [saving, setSaving] = useState(false)
  const [editItem, setEditItem] = useState<EstimasiItem | null>(null)
  const [hapusItem, setHapusItem] = useState<EstimasiItem | null>(null)

  useEffect(() => {
    let aktif = true
    tenderService
      .detail(uuid)
      .then((result) => aktif && setData({ key: reloadKey, result }))
      .catch((err) => {
        if (!aktif) return
        const pesan =
          err instanceof ApiError && err.status === 404
            ? "Proyek tidak ditemukan."
            : apiErrorMessage(err, "Gagal memuat detail proyek")
        setData({ key: reloadKey, result: null, error: pesan })
      })
    return () => {
      aktif = false
    }
  }, [uuid, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  if (!data || (data.key !== reloadKey && !data.result)) {
    return (
      <p className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Memuat detail proyek...
      </p>
    )
  }
  if (!data.result) {
    return (
      <div className="space-y-4">
        <KembaliLink />
        <p className="text-sm text-destructive">{data.error}</p>
      </div>
    )
  }

  const { project, headers } = data.result
  const totalBaru = itemsBaru.reduce((sum, it) => sum + amountBaru(it), 0)
  const adaPerubahan = headersBaru.length > 0 || itemsBaru.length > 0

  const ubahItem = (key: number, patch: Partial<ItemBaru>) =>
    setItemsBaru((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)))

  // Pilih pekerjaan bank data: harga referensi & tahun diambil dari backend; nama/unit diisi kalau masih kosong.
  async function pilihPekerjaan(it: ItemBaru, pekerjaan: PekerjaanOption | null) {
    if (!pekerjaan) {
      ubahItem(it.key, { pekerjaan: null, harga: "", tahun: "" })
      return
    }
    ubahItem(it.key, { pekerjaan, nama: it.nama || pekerjaan.nama, memuatHarga: true })
    try {
      const harga = await tenderService.hargaPekerjaan(pekerjaan.id)
      setItemsBaru((prev) =>
        prev.map((x) =>
          x.key === it.key && x.pekerjaan?.id === pekerjaan.id
            ? { ...x, harga: formatAngka(harga.harga, 2), tahun: harga.tahun, unit: x.unit || harga.satuan, memuatHarga: false }
            : x
        )
      )
    } catch (err) {
      ubahItem(it.key, { memuatHarga: false })
      toast.error(apiErrorMessage(err, "Gagal mengambil harga pekerjaan"))
    }
  }

  function hapusHeaderBaru(tempId: string) {
    setHeadersBaru((prev) => prev.filter((h) => h.tempId !== tempId))
    setItemsBaru((prev) => prev.filter((it) => it.headerId !== tempId))
  }

  async function handleSimpan() {
    if (headersBaru.some((h) => !h.nama.trim())) {
      toast.error("Nama header baru wajib diisi.")
      return
    }
    setSaving(true)
    try {
      const res = await tenderService.simpanEstimasi(uuid, {
        headers: headersBaru.map((h) => ({ temp_id: h.tempId, header_name: h.nama })),
        items: itemsBaru.map((it) => ({
          header_id: it.headerId,
          nama_pekerjaan: it.nama,
          id_pekerjaan: it.pekerjaan?.id ?? "",
          unit: it.unit,
          volume: parseAngka(it.volume),
          adj: parseAngka(it.adj),
          price_ref: parseAngka(it.harga),
          ref_price_year: it.tahun,
          project_ref: it.pekerjaan?.project ?? "",
        })),
      })
      if (res.success) {
        toast.success(res.message)
        setHeadersBaru([])
        setItemsBaru([])
        reload()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal menyimpan estimasi"))
    } finally {
      setSaving(false)
    }
  }

  async function handleHapusItem() {
    if (!hapusItem) return
    try {
      const res = await tenderService.hapusItem(uuid, hapusItem.id)
      if (res.success) {
        toast.success(res.message)
        reload()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal menghapus item"))
    } finally {
      setHapusItem(null)
    }
  }

  const barisItemBaru = (headerId: string) =>
    itemsBaru
      .filter((it) => it.headerId === headerId)
      .map((it) => (
        <TableRow key={it.key} className="bg-blue-50/40 align-top hover:bg-blue-50/60">
          <TableCell className="pt-4 pl-4 text-muted-foreground">#</TableCell>
          <TableCell>
            <Input value={it.nama} onChange={(e) => ubahItem(it.key, { nama: e.target.value })} placeholder="Nama pekerjaan" />
          </TableCell>
          <TableCell>
            <Input value={it.unit} onChange={(e) => ubahItem(it.key, { unit: e.target.value })} />
          </TableCell>
          <TableCell>
            <PekerjaanCombobox
              idLocation={project.id_location}
              value={it.pekerjaan}
              onChange={(p) => pilihPekerjaan(it, p)}
            />
          </TableCell>
          <TableCell>
            <Input
              inputMode="decimal"
              value={it.volume}
              onChange={(e) => ubahItem(it.key, { volume: e.target.value })}
              className="text-right tabular-nums"
            />
          </TableCell>
          <TableCell>
            <Input
              inputMode="decimal"
              value={it.adj}
              onChange={(e) => ubahItem(it.key, { adj: e.target.value })}
              className="text-right tabular-nums"
            />
          </TableCell>
          <TableCell>
            <div className="relative">
              <Input
                inputMode="decimal"
                value={it.harga}
                onChange={(e) => ubahItem(it.key, { harga: e.target.value })}
                placeholder="0"
                className="text-right tabular-nums"
              />
              {it.memuatHarga && (
                <Loader2 className="absolute top-1/2 left-2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </TableCell>
          <TableCell className="pt-4 text-center">{it.tahun || "-"}</TableCell>
          <TableCell className="pt-4">
            <RefProject value={it.pekerjaan?.project} />
          </TableCell>
          <TableCell className="pt-4 text-right font-mono tabular-nums">{formatAngka(amountBaru(it))}</TableCell>
          <TableCell className="pr-4 text-center">
            <Button
              variant="ghost"
              size="icon-sm"
              title="Hapus baris"
              className="text-destructive hover:text-destructive"
              onClick={() => setItemsBaru((prev) => prev.filter((x) => x.key !== it.key))}
            >
              <X />
            </Button>
          </TableCell>
        </TableRow>
      ))

  const tombolTambahItem = (headerId: string) => (
    <Button
      variant="outline"
      size="icon-sm"
      title="Tambah item"
      onClick={() => setItemsBaru((prev) => [...prev, itemBaru(headerId)])}
    >
      <Plus />
    </Button>
  )

  return (
    <div className="space-y-6">
      <KembaliLink />

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Proyek</p>
            <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.location ?? "-"}, Indonesia</p>
            <p className="pt-2 text-sm">
              <span className="text-muted-foreground">HPS (Estimasi) &amp; Durasi: </span>
              <span className="font-semibold">Rp {formatAngka(project.hps, 2)}</span>
              <span className="text-muted-foreground"> ({project.month_imp ?? "-"} bulan)</span>
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="md:text-right">
              <p className="text-xs text-muted-foreground">Tanggal Dibuat</p>
              <p className="font-semibold">{formatTanggal(project.created_at)}</p>
              {project.created_by && <p className="text-xs text-muted-foreground">oleh {project.created_by}</p>}
            </div>
            <Button asChild variant="outline">
              <Link to={`${ROUTES.quickCountData}${toQuery({ project: project.uuid })}`}>
                <Calculator />
                Quick Count
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      <Card className="gap-0 py-0">
        {/* Nama Item & Item mengisi sisa lebar; kolom lain tetap. Di layar sempit tabel digeser ke samping. */}
        <Table className="min-w-320 table-fixed text-[13px]">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-20" />
            <col />
            <col className="w-24" />
            <col className="w-20" />
            <col className="w-32" />
            <col className="w-20" />
            <col className="w-44" />
            <col className="w-36" />
            <col className="w-20" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-muted/50 text-xs uppercase hover:bg-muted/50">
              <TableHead className="pl-4">No</TableHead>
              <TableHead>Nama Item</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">Adj</TableHead>
              <TableHead className="text-right">Ref. Harga</TableHead>
              <TableHead className="text-center">Ref. Tahun</TableHead>
              <TableHead>Ref. Project</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {headers.length === 0 && headersBaru.length === 0 && (
              <TableRow>
                <TableCell colSpan={KOLOM} className="h-24 text-center text-muted-foreground">
                  Belum ada item estimasi. Klik "Tambah Header" untuk mulai.
                </TableCell>
              </TableRow>
            )}
            {headers.map((h) => (
              <Fragment key={h.id}>
                <TableRow className="bg-muted/40 font-bold hover:bg-muted/40">
                  <TableCell colSpan={KOLOM - 1} className="pl-4 uppercase" style={{ paddingLeft: 16 + h.level * 20 }}>
                    {h.name}
                  </TableCell>
                  <TableCell className="pr-4 text-center">{tombolTambahItem(String(h.id))}</TableCell>
                </TableRow>
                {h.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="pl-4">{it.no}</TableCell>
                    <TableCell className="whitespace-normal">{it.nama_pekerjaan || "-"}</TableCell>
                    <TableCell>{it.unit || "-"}</TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">{it.nama_material || "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatAngka(it.volume, 2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatAngka(it.adj, 2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatAngka(it.price_ref)}</TableCell>
                    <TableCell className="text-center">{it.ref_price_year || "-"}</TableCell>
                    <TableCell>
                      <RefProject value={it.project_ref} />
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">{formatAngka(it.amount)}</TableCell>
                    <TableCell className="pr-4 text-center">
                      <div className="flex justify-center">
                        <Button variant="ghost" size="icon-sm" title="Edit item" onClick={() => setEditItem(it)}>
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Hapus item"
                          className="hover:text-destructive"
                          onClick={() => setHapusItem(it)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {barisItemBaru(String(h.id))}
              </Fragment>
            ))}
            {headersBaru.map((h) => (
              <Fragment key={h.tempId}>
                <TableRow className="bg-blue-50/60 hover:bg-blue-50/60">
                  <TableCell colSpan={KOLOM - 1} className="pl-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Header baru</Badge>
                      <Input
                        value={h.nama}
                        onChange={(e) =>
                          setHeadersBaru((prev) => prev.map((x) => (x.tempId === h.tempId ? { ...x, nama: e.target.value } : x)))
                        }
                        placeholder="Nama header, mis. PEKERJAAN STRUKTUR"
                        className="max-w-md font-semibold"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Hapus header baru"
                        className="text-destructive hover:text-destructive"
                        onClick={() => hapusHeaderBaru(h.tempId)}
                      >
                        <X />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="pr-4 text-center">{tombolTambahItem(h.tempId)}</TableCell>
                </TableRow>
                {barisItemBaru(h.tempId)}
              </Fragment>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            onClick={() => setHeadersBaru((prev) => [...prev, { tempId: `baru-${nextKey++}`, nama: "" }])}
          >
            <Plus />
            Tambah Header
          </Button>
          <div className="flex items-center gap-3">
            {adaPerubahan && (
              <span className="text-sm text-muted-foreground">
                {headersBaru.length} header &amp; {itemsBaru.length} item belum disimpan
              </span>
            )}
            <Button onClick={handleSimpan} disabled={!adaPerubahan || saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Simpan Estimasi
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col items-end gap-1 rounded-xl bg-primary px-6 py-5 text-primary-foreground">
        <span className="text-sm font-semibold tracking-wide">TOTAL BIAYA</span>
        <span className="text-3xl font-bold tabular-nums">Rp. {formatAngka(project.cost + totalBaru)}</span>
        {totalBaru !== 0 && (
          <span className="text-xs opacity-80">
            termasuk Rp {formatAngka(totalBaru)} dari item yang belum disimpan
          </span>
        )}
      </div>

      <EditItemDialog
        key={editItem?.id ?? "tutup"}
        projectUuid={uuid}
        item={editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        onSaved={reload}
      />

      <AlertDialog open={!!hapusItem} onOpenChange={(open) => !open && setHapusItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus item?</AlertDialogTitle>
            <AlertDialogDescription>
              Item "{hapusItem?.nama_pekerjaan}" (Rp {formatAngka(hapusItem?.amount)}) akan dihapus dan total biaya
              proyek dikurangi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleHapusItem}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Nama proyek referensi bisa sangat panjang: tampil maks 2 baris, lengkapnya di tooltip.
function RefProject({ value }: { value: string | null | undefined }) {
  return (
    <span className="line-clamp-2 text-xs whitespace-normal text-muted-foreground" title={value ?? undefined}>
      {value || "-"}
    </span>
  )
}

function KembaliLink() {
  return (
    <Button asChild variant="ghost" className="-ml-2.5 text-slate-600">
      <Link to={ROUTES.quickCountHistory}>
        <ArrowLeft />
        Kembali ke history
      </Link>
    </Button>
  )
}
