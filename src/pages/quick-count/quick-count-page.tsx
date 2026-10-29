import { Calculator, FileUp, Loader2, Save } from "lucide-react"
import { Fragment, useEffect, useRef, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { AngkaInput } from "@/components/common/angka-input"
import { SearchableSelect } from "@/components/common/searchable-select"
import { YearPicker } from "@/components/common/year-picker"
import { PekerjaanCombobox } from "@/components/tender/pekerjaan-combobox"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ROUTES } from "@/config/menu"
import { formatAngka, formatSatuan } from "@/lib/format"
import { RekomendasiLoader, type LoaderState } from "@/pages/quick-count/rekomendasi-loader"
import { RekomendasiPopover } from "@/pages/quick-count/rekomendasi-popover"
import { UploadDialog } from "@/pages/quick-count/upload-dialog"
import { apiErrorMessage, toQuery } from "@/services/api"
import { tenderService } from "@/services/tender-service"
import type { LokasiProvinsi, PekerjaanOption, PreviewBaris, PreviewResult, RekomendasiAnalisa } from "@/types/tender"

interface BarisHeader {
  type: "header"
  key: number
  kode: string
  nama: string
}

interface BarisItem {
  type: "item"
  key: number
  no: string
  nama: string
  volume: number
  unit: string
  adj: string // teks input (titik desimal); kosong/0 dihitung 1
  harga: number
  tahun: string
  satuanRef: string
  projectRef: string
  pekerjaan: PekerjaanOption | null
  memuatHarga: boolean
  rekomendasi: RekomendasiAnalisa[]
}

type Baris = BarisHeader | BarisItem

const adjEfektif = (adj: string) => parseFloat(adj) || 1
const amountBaris = (b: BarisItem) => b.volume * adjEfektif(b.adj) * b.harga
const tunggu = (ms: number) => new Promise((r) => setTimeout(r, ms))

const labelLokasi = (l: LokasiProvinsi) => (l.alias ? `${l.alias} - ${l.nama}` : l.nama)

function dariPreview(data: PreviewBaris[]): Baris[] {
  return data.map((row, i) =>
    row.is_header
      ? { type: "header", key: i, kode: row.kode ?? "", nama: row.nama }
      : {
          type: "item",
          key: i,
          no: row.no ?? "",
          nama: row.nama,
          volume: row.volume,
          unit: row.unit ?? "",
          adj: row.adj.toFixed(2),
          harga: row.ref_price,
          tahun: "",
          satuanRef: "",
          projectRef: "",
          pekerjaan: null,
          memuatHarga: false,
          rekomendasi: [],
        }
  )
}

export function QuickCountPage() {
  const navigate = useNavigate()
  const [lokasiList, setLokasiList] = useState<LokasiProvinsi[]>([])
  const [namaProyek, setNamaProyek] = useState("")
  const [idLokasi, setIdLokasi] = useState("")
  const [tipe, setTipe] = useState("")
  const [hps, setHps] = useState(0)
  const [tahun, setTahun] = useState("")
  const [bulan, setBulan] = useState("")
  const [baris, setBaris] = useState<Baris[]>([])

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadGagal, setUploadGagal] = useState<PreviewResult | null>(null)
  const [loader, setLoader] = useState<LoaderState | null>(null)
  const [saving, setSaving] = useState(false)
  // Permintaan rekomendasi terakhir; hasil permintaan lama diabaikan.
  const rekomendasiKe = useRef(0)

  useEffect(() => {
    tenderService
      .lokasi()
      .then(setLokasiList)
      .catch((err) => toast.error(apiErrorMessage(err, "Gagal memuat daftar lokasi")))
  }, [])

  const lokasiDipilih = lokasiList.find((l) => l.kode === idLokasi)
  const items = baris.filter((b): b is BarisItem => b.type === "item")
  const total = items.reduce((sum, b) => sum + amountBaris(b), 0)

  const ubahItem = (key: number, patch: Partial<BarisItem>) =>
    setBaris((prev) => prev.map((b) => (b.key === key && b.type === "item" ? { ...b, ...patch } : b)))

  // Rekomendasi analisa AHSP untuk semua item (berdasarkan nama & lokasi), dengan loader bertahap.
  async function muatRekomendasi(daftar: Baris[], kodeLokasi: string) {
    const target = daftar.filter((b): b is BarisItem => b.type === "item")
    const lokasi = lokasiList.find((l) => l.kode === kodeLokasi)
    if (!kodeLokasi || !target.length) {
      setLoader(null)
      return
    }
    const ke = ++rekomendasiKe.current
    const mulai = Date.now()
    setLoader({
      title: "Menerapkan rekomendasi",
      sub: `Mencocokkan ${target.length} pekerjaan dengan bank data AHSP ${lokasi ? labelLokasi(lokasi) : ""}`,
      step: 2,
    })
    let ditemukan = 0
    let gagal = false
    try {
      const hasil = await tenderService.rekomendasi(
        kodeLokasi,
        target.map((b) => b.nama)
      )
      if (ke !== rekomendasiKe.current) return
      const perKey = new Map(target.map((b, i) => [b.key, hasil[i] ?? []]))
      ditemukan = [...perKey.values()].filter((list) => list.length).length
      setBaris((prev) => prev.map((b) => (b.type === "item" ? { ...b, rekomendasi: perKey.get(b.key) ?? [] } : b)))
    } catch {
      gagal = true
    }
    await tunggu(Math.max(0, 900 - (Date.now() - mulai)))
    if (ke !== rekomendasiKe.current) return
    setLoader((l) => l && { ...l, step: 3 })
    await tunggu(400)
    setLoader({
      title: gagal
        ? "Rekomendasi gagal dimuat"
        : ditemukan
          ? `${ditemukan} rekomendasi ditemukan`
          : "Belum ada rekomendasi",
      sub: gagal
        ? "Silakan coba lagi."
        : ditemukan
          ? "Buka rekomendasi analisa pada baris untuk memilih opsi."
          : "Tidak ada analisa yang mirip di lokasi ini.",
      step: 3,
      done: true,
    })
    await tunggu(1100)
    if (ke === rekomendasiKe.current) setLoader(null)
  }

  async function handleUpload(file: File) {
    setUploadGagal(null)
    setLoader({ title: "Mengunggah file", sub: file.name, step: 1 })
    try {
      const res = await tenderService.previewExcel(file)
      if (!res.success || !res.data) {
        setLoader(null)
        setUploadGagal(res)
        return
      }
      const baru = dariPreview(res.data)
      setBaris(baru)
      setUploadOpen(false)
      await muatRekomendasi(baru, idLokasi)
    } catch (err) {
      setLoader(null)
      setUploadGagal({ success: false, message: apiErrorMessage(err, "Gagal mengunggah file") })
    }
  }

  function gantiLokasi(kode: string) {
    setIdLokasi(kode)
    if (items.length) void muatRekomendasi(baris, kode)
  }

  // Pilih pekerjaan bank data: harga referensi = Σ harga terbaru material × koefisien.
  async function pilihPekerjaan(b: BarisItem, pekerjaan: PekerjaanOption | null) {
    if (!pekerjaan) {
      ubahItem(b.key, { pekerjaan: null, harga: 0, tahun: "", satuanRef: "", projectRef: "" })
      return
    }
    ubahItem(b.key, { pekerjaan, projectRef: pekerjaan.project ?? "", memuatHarga: true })
    try {
      const harga = await tenderService.hargaPekerjaan(pekerjaan.id)
      setBaris((prev) =>
        prev.map((x) =>
          x.key === b.key && x.type === "item" && x.pekerjaan?.id === pekerjaan.id
            ? { ...x, harga: harga.harga, tahun: harga.tahun, satuanRef: harga.satuan, memuatHarga: false }
            : x
        )
      )
    } catch (err) {
      ubahItem(b.key, { memuatHarga: false })
      toast.error(apiErrorMessage(err, "Gagal mengambil harga pekerjaan"))
    }
  }

  function pilihRekomendasi(b: BarisItem, rek: RekomendasiAnalisa) {
    ubahItem(b.key, {
      pekerjaan: {
        id: rek.id,
        nama: `AHSP ${rek.kode} - ${rek.nama}`,
        project: `AHSP ${rek.kode}`,
        kategori: "non-subkon",
      },
      harga: rek.total,
      tahun: rek.tahun ? String(rek.tahun) : "",
      satuanRef: rek.unit ?? "",
      projectRef: `AHSP ${rek.kode}`,
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!idLokasi) {
      toast.error("Silakan pilih lokasi.")
      return
    }
    if (!items.length) {
      toast.error("Item masih kosong. Unggah file quick count terlebih dahulu.")
      return
    }
    setSaving(true)
    try {
      const res = await tenderService.simpanQuickCount({
        project_name: namaProyek,
        id_location: idLokasi,
        construction_type: tipe,
        nilai_hps: hps,
        years_imp: tahun,
        month_imp: bulan,
        items: baris.map((b) =>
          b.type === "header"
            ? { is_header: true, header_name: b.nama }
            : {
                is_header: false,
                nama_pekerjaan: b.nama,
                id_pekerjaan: b.pekerjaan?.id ?? "",
                volume: b.volume,
                adj: adjEfektif(b.adj),
                price_ref: b.harga,
                unit: b.unit,
                ref_price_year: b.tahun,
                project_ref: b.projectRef,
              }
        ),
      })
      if (res.success && res.uuid) {
        toast.success(res.message)
        navigate(`${ROUTES.quickCountData}${toQuery({ project: res.uuid })}`)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal menyimpan estimasi"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card className="gap-0 py-0">
          <div className="flex items-center gap-2 border-b px-6 py-5">
            <Calculator className="size-5 text-muted-foreground" />
            <h1 className="text-xl">
              Quick <b>Count</b>
            </h1>
          </div>

          <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="namaProyek">Nama Proyek</Label>
              <Input
                id="namaProyek"
                value={namaProyek}
                onChange={(e) => setNamaProyek(e.target.value)}
                placeholder="Nama Proyek"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi</Label>
              <SearchableSelect
                id="lokasi"
                options={lokasiList.map((l) => ({ value: l.kode, label: labelLokasi(l) }))}
                value={idLokasi}
                onValueChange={gantiLokasi}
                placeholder="Pilih Lokasi"
                searchPlaceholder="Cari kode atau nama provinsi..."
                emptyText="Lokasi tidak ditemukan."
              />
            </div>
            <div className="grid gap-4 md:col-span-2 md:grid-cols-[1fr_1fr_180px_180px]">
              <div className="space-y-2">
                <Label htmlFor="tipeKonstruksi">Tipe Konstruksi</Label>
                <Input
                  id="tipeKonstruksi"
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value)}
                  placeholder="Tipe Konstruksi"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hps">HPS (Rp)</Label>
                <AngkaInput id="hps" value={hps} onValueChange={setHps} className="text-left" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tahunImp">Tahun</Label>
                <YearPicker id="tahunImp" value={tahun} onChange={setTahun} placeholder="Tahun Implementasi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durasi">Durasi (Bulan)</Label>
                <Input
                  id="durasi"
                  inputMode="numeric"
                  value={bulan}
                  onChange={(e) => setBulan(e.target.value.replace(/\D/g, ""))}
                  placeholder="Bulan"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end px-6 pb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!idLokasi) {
                  toast.error("Silakan pilih Lokasi terlebih dahulu.")
                  return
                }
                setUploadGagal(null)
                setUploadOpen(true)
              }}
            >
              <FileUp />
              Unggah File
            </Button>
          </div>

          <Table className="min-w-320 table-fixed text-[13px]">
            {/* Kolom Item (combobox + rekomendasi) mengisi sisa lebar. */}
            <colgroup>
              <col className="w-14" />
              <col className="w-44" />
              <col className="w-24" />
              <col className="w-20" />
              <col />
              <col className="w-24" />
              <col className="w-36" />
              <col className="w-20" />
              <col className="w-40" />
              <col className="w-36" />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs uppercase hover:bg-muted/50">
                <TableHead className="pl-6">No</TableHead>
                <TableHead className="whitespace-normal">Nama Item Pekerjaan</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Adj. Koef</TableHead>
                <TableHead className="text-right">Ref. Harga (Rp)</TableHead>
                <TableHead className="text-center">Tahun</TableHead>
                <TableHead className="text-right">Total Estimasi (Rp)</TableHead>
                <TableHead className="pr-6">Ref Proyek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {baris.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="h-28 text-center text-muted-foreground">
                    Pilih lokasi lalu klik "Unggah File" untuk memuat item pekerjaan dari Excel.
                  </TableCell>
                </TableRow>
              )}
              {baris.map((b) =>
                b.type === "header" ? (
                  <TableRow key={b.key} className="bg-muted/40 hover:bg-muted/40">
                    <TableCell className="pl-6">
                      <span className="inline-flex min-w-6 items-center justify-center rounded bg-blue-800 px-1.5 py-0.5 text-xs font-bold text-white">
                        {b.kode}
                      </span>
                    </TableCell>
                    <TableCell colSpan={9} className="font-bold uppercase">
                      {b.nama}
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={b.key} className="align-top">
                    <TableCell className="pt-4 pl-6">{b.no}</TableCell>
                    <TableCell className="pt-4 font-semibold whitespace-normal">{b.nama}</TableCell>
                    <TableCell className="pt-4 text-right font-mono tabular-nums">{formatAngka(b.volume, 2)}</TableCell>
                    <TableCell className="pt-3.5">
                      {b.unit && <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{formatSatuan(b.unit)}</span>}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <PekerjaanCombobox
                        idLocation={idLokasi || null}
                        itemName={b.nama}
                        value={b.pekerjaan}
                        onChange={(p) => pilihPekerjaan(b, p)}
                        placeholder="Select Item"
                      />
                      <RekomendasiPopover
                        list={b.rekomendasi}
                        dipakaiId={b.pekerjaan?.id ?? null}
                        hargaRef={b.harga}
                        onPilih={(rek) => pilihRekomendasi(b, rek)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        inputMode="decimal"
                        value={b.adj}
                        onChange={(e) => {
                          const [bulat, ...sisa] = e.target.value.replace(/[^0-9.]/g, "").split(".")
                          ubahItem(b.key, { adj: sisa.length ? `${bulat}.${sisa.join("")}` : bulat })
                        }}
                        className="text-right font-mono tabular-nums"
                        aria-label={`Adj ${b.nama}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <AngkaInput
                          value={b.harga}
                          onValueChange={(harga) => ubahItem(b.key, { harga })}
                          aria-label={`Harga ${b.nama}`}
                        />
                        {b.memuatHarga && (
                          <Loader2 className="absolute top-1/2 left-2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      {b.satuanRef && (
                        <p className="mt-1 text-right text-xs text-muted-foreground">/ {formatSatuan(b.satuanRef)}</p>
                      )}
                    </TableCell>
                    <TableCell className="pt-4 text-center">{b.tahun}</TableCell>
                    <TableCell className="pt-4 text-right font-mono font-semibold tabular-nums">
                      {formatAngka(amountBaris(b), 2)}
                    </TableCell>
                    <TableCell className="pt-4 pr-6">
                      <span
                        className="line-clamp-2 text-xs whitespace-normal text-muted-foreground"
                        title={b.projectRef}
                      >
                        {b.projectRef}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={8} className="pl-6 font-bold">
                  TOTAL
                </TableCell>
                <TableCell className="text-right font-mono font-bold tabular-nums">{formatAngka(total, 2)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>

          <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {items.length > 0 && (
                <Fragment>
                  {items.length} item · {items.filter((b) => b.pekerjaan).length} sudah memakai referensi harga
                  {lokasiDipilih && ` · lokasi ${labelLokasi(lokasiDipilih)}`}
                </Fragment>
              )}
            </p>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Simpan Estimasi &amp; Lanjutkan
            </Button>
          </div>
        </Card>
      </form>

      {/* Di luar <form>: submit form dialog (lewat portal) tetap merambat ke form induk di React. */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        gagal={uploadGagal}
        sedangProses={loader !== null}
        onUpload={handleUpload}
      />
      <RekomendasiLoader state={loader} />
    </>
  )
}
