import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronDown,
  Download,
  History,
  Loader2,
  MapPin,
  SlidersHorizontal,
  Wallet,
} from "lucide-react"
import { Fragment, useEffect, useState, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { AngkaInput } from "@/components/common/angka-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ROUTES } from "@/config/menu"
import { formatAngka } from "@/lib/format"
import { BARIS_PERSEN, TABEL_KLASIFIKASI, hitungQuickCount, type KodePersen } from "@/lib/quick-count"
import { cn } from "@/lib/utils"
import { ApiError, apiErrorMessage } from "@/services/api"
import { tenderService } from "@/services/tender-service"
import type { ProjectDetailResult } from "@/types/tender"

const PERSEN_AWAL = Object.fromEntries([...BARIS_PERSEN, "26"].map((k) => [k, ""])) as Record<KodePersen, string>
const persenAngka = (teks: string) => parseFloat(teks.replace(",", ".")) || 0
const tampilPersen = (n: number) => `${n.toFixed(2)}%`

export function QuickCountDataPage() {
  const [params] = useSearchParams()
  const uuid = params.get("project") ?? ""
  const [data, setData] = useState<{ uuid: string; result: ProjectDetailResult | null; error?: string } | null>(null)

  useEffect(() => {
    let aktif = true
    tenderService
      .detail(uuid)
      .then((result) => aktif && setData({ uuid, result }))
      .catch((err) => {
        if (!aktif) return
        const pesan =
          err instanceof ApiError && err.status === 404
            ? "Proyek tidak ditemukan."
            : apiErrorMessage(err, "Gagal memuat quick count")
        setData({ uuid, result: null, error: pesan })
      })
    return () => {
      aktif = false
    }
  }, [uuid])

  if (!data || data.uuid !== uuid) {
    return (
      <p className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Memuat quick count...
      </p>
    )
  }
  if (!data.result) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" className="-ml-2.5 text-slate-600">
          <Link to={ROUTES.quickCount}>
            <ArrowLeft />
            Kembali ke Quick Count
          </Link>
        </Button>
        <p className="text-sm text-destructive">{data.error}</p>
      </div>
    )
  }
  return <QuickCountHasil key={uuid} result={data.result} />
}

function QuickCountHasil({ result }: { result: ProjectDetailResult }) {
  const { project, headers } = result
  const hps = project.hps ?? 0
  const durasi = Number(project.month_imp) || 0
  const jumlahItem = headers.reduce((sum, h) => sum + h.items.length, 0)

  const [itemTerbuka, setItemTerbuka] = useState(false)
  const [biayaLain, setBiayaLain] = useState(0)
  const [persen, setPersen] = useState(PERSEN_AWAL)
  const [mengekspor, setMengekspor] = useState<"item" | "hasil" | null>(null)

  const persenNum = Object.fromEntries(Object.entries(persen).map(([k, v]) => [k, persenAngka(v)])) as Record<
    KodePersen,
    number
  >
  const hasil = hitungQuickCount({
    biayaKonstruksi: project.cost,
    hps,
    durasiBulan: durasi,
    biayaLain,
    persen: persenNum,
  })
  const D = hasil.nilai

  // Persen tiap baris: input user, atau hasil hitung untuk baris 1.1 & 1.2.
  const persenBaris = (kode: string) =>
    kode in persen ? tampilPersen(persenNum[kode as KodePersen]) : tampilPersen(hasil.persenTampil[kode] ?? 0)

  async function eksporItem() {
    setMengekspor("item")
    try {
      await tenderService.eksporItem(project.uuid, project.name)
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal mengekspor item pekerjaan"))
    } finally {
      setMengekspor(null)
    }
  }

  async function eksporHasil() {
    setMengekspor("hasil")
    try {
      await tenderService.eksporHasil(project.uuid, project.name, {
        kontrol_biaya_umum: hasil.kontrolBiayaUmum,
        rows: [
          ...TABEL_KLASIFIKASI.map((r) =>
            r.kategori
              ? { no: "", label: r.label.toUpperCase(), nilai: null, persen: "", kategori: true }
              : { no: r.no, label: r.label, nilai: D[r.kode!], persen: persenBaris(r.kode!), kategori: false }
          ),
          { no: "", label: "HASIL QUICK COUNT (Non PPN)", nilai: D["25"], persen: "", kategori: false },
          { no: "", label: "PPN", nilai: D["26"], persen: tampilPersen(persenNum["26"]), kategori: false },
          {
            no: "",
            label: "HASIL QUICK COUNT",
            nilai: D["27"],
            persen: tampilPersen(hasil.persenTampil["27"]),
            kategori: false,
          },
        ],
      })
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal mengekspor quick count"))
    } finally {
      setMengekspor(null)
    }
  }

  const [bulat, desimal] = formatAngka(D["27"], 2).split(",")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" className="-ml-2.5 text-slate-600">
          <Link to={ROUTES.quickCount}>
            <ArrowLeft />
            Quick Count baru
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`${ROUTES.quickCountHistory}/${project.uuid}`}>
            <History />
            Lihat / edit item di History
          </Link>
        </Button>
      </div>

      {/* Header proyek */}
      <Card className="gap-4 px-6 py-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Tahun {project.years_imp || "-"}</Badge>
          {project.construction_type && project.construction_type !== "-" && (
            <Badge variant="outline">{project.construction_type}</Badge>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            Quick count estimasi biaya{project.created_by && ` · dibuat oleh ${project.created_by}`}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoBlok icon={<Building2 />} label="Proyek" value={project.name} />
          <InfoBlok icon={<MapPin />} label="Lokasi" value={project.location ?? "-"} />
          <InfoBlok icon={<CalendarDays />} label="Durasi Proyek" value={`${project.month_imp || "-"} Bulan`} />
          <InfoBlok icon={<Wallet />} label="HPS (Rp)" value={formatAngka(hps, 2)} />
        </div>
      </Card>

      {/* Data item pekerjaan */}
      <Card className="gap-0 py-0">
        <button
          type="button"
          onClick={() => setItemTerbuka((v) => !v)}
          aria-expanded={itemTerbuka}
          className="flex w-full items-center gap-3 px-6 py-4 text-left"
        >
          <span className="font-semibold">Data Item Pekerjaan</span>
          <Badge variant="secondary">{jumlahItem} Item Terdata</Badge>
          <span className="text-xs text-muted-foreground">klik untuk {itemTerbuka ? "menutup" : "melihat detail"}</span>
          <ChevronDown className={cn("ml-auto size-4 transition-transform", itemTerbuka && "rotate-180")} />
        </button>
        {itemTerbuka && (
          <div className="border-t">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs uppercase hover:bg-muted/50">
                  <TableHead className="pl-6">No</TableHead>
                  <TableHead>Nama Item</TableHead>
                  <TableHead className="text-center">Unit</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Adj</TableHead>
                  <TableHead className="text-right">Ref. Harga</TableHead>
                  <TableHead className="text-center">Ref. Tahun</TableHead>
                  <TableHead>Ref. Project</TableHead>
                  <TableHead className="pr-6 text-right">Total (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {headers.map((h) => {
                  const subtotal = h.items.reduce((sum, it) => sum + it.amount, 0)
                  return (
                    <Fragment key={h.id}>
                      <TableRow className="bg-muted/40 font-bold hover:bg-muted/40">
                        <TableCell colSpan={9} className="pl-6 uppercase">
                          {h.name}
                        </TableCell>
                      </TableRow>
                      {h.items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="pl-6">{it.no}</TableCell>
                          <TableCell className="whitespace-normal">{it.nama_pekerjaan}</TableCell>
                          <TableCell className="text-center">{it.unit}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatAngka(it.volume, 2)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatAngka(it.adj, 2)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatAngka(it.price_ref)}</TableCell>
                          <TableCell className="text-center">{it.ref_price_year}</TableCell>
                          <TableCell
                            className="max-w-56 truncate text-xs text-muted-foreground"
                            title={it.project_ref ?? ""}
                          >
                            {it.project_ref}
                          </TableCell>
                          <TableCell className="pr-6 text-right font-mono tabular-nums">
                            {formatAngka(it.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {h.items.length > 0 && (
                        <TableRow className="text-xs hover:bg-transparent">
                          <TableCell colSpan={6} className="text-right font-semibold uppercase">
                            Subtotal {h.name}:
                          </TableCell>
                          <TableCell colSpan={2} className="text-muted-foreground">
                            {h.items.length} Item
                          </TableCell>
                          <TableCell className="pr-6 text-right font-mono font-semibold tabular-nums">
                            Rp {formatAngka(subtotal)}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
            <div className="flex justify-end border-t px-6 py-3">
              <Button variant="outline" onClick={eksporItem} disabled={mengekspor !== null}>
                {mengekspor === "item" ? <Loader2 className="animate-spin" /> : <Download />}
                Export Item Pekerjaan (.xlsx)
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        {/* Kolom kiri: parameter & ringkasan */}
        <div className="space-y-6">
          <Card className="gap-4 px-6 py-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <SlidersHorizontal className="size-4" />
              Parameter &amp; Kontrol Biaya
            </h2>
            <div className="space-y-1.5">
              <Label>HPS (Harga Perkiraan Sendiri)</Label>
              <Input value={`Rp ${formatAngka(hps, 2)}`} readOnly className="bg-muted text-right tabular-nums" />
              <p className="text-xs text-muted-foreground">Nilai pagu acuan penawaran tender</p>
            </div>
            <div className="space-y-1.5">
              <Label>Kontrol Biaya Umum (Rp / Bulan)</Label>
              <Input
                value={`Rp ${formatAngka(hasil.kontrolBiayaUmum, 2)}`}
                readOnly
                className="bg-muted text-right tabular-nums"
              />
              <p className="text-xs text-muted-foreground">Biaya umum dibagi durasi proyek (bulan)</p>
            </div>
          </Card>

          <Card className="gap-2 bg-primary px-6 py-5 text-primary-foreground ring-0">
            <p className="text-sm font-semibold">Total Nilai Estimasi</p>
            <p className="text-xs opacity-70">Quick Count Estimate</p>
            <p className="text-3xl font-bold tabular-nums">
              Rp {bulat}
              <small className="text-base opacity-70">,{desimal}</small>
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3 border-t border-white/15 pt-3 text-xs">
              <div>
                <p className="opacity-70">Persentase thd HPS</p>
                <p className="text-sm font-semibold">{formatAngka(hasil.persenTampil["27"], 2)}%</p>
              </div>
              <div>
                <p className="opacity-70">Non PPN</p>
                <p className="text-sm font-semibold tabular-nums">{formatAngka(D["25"], 2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Kolom kanan: klasifikasi biaya */}
        <Card className="gap-0 py-0">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold">Klasifikasi Biaya &amp; Quick Count</h2>
            <p className="text-xs text-muted-foreground">
              Rincian perhitungan biaya langsung, biaya tidak langsung, dan biaya lain-lain
            </p>
          </div>
          <Table className="text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs uppercase hover:bg-muted/50">
                <TableHead className="w-14 pl-6">No</TableHead>
                <TableHead>Klasifikasi Biaya</TableHead>
                <TableHead className="text-right">Nilai (Rp)</TableHead>
                <TableHead className="w-40 pr-6 text-right">Persentase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TABEL_KLASIFIKASI.map((r) =>
                r.kategori ? (
                  <TableRow key={r.no} className="bg-muted/40 font-bold hover:bg-muted/40">
                    <TableCell colSpan={4} className="pl-6">
                      {r.label}
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={r.kode}>
                    <TableCell className="pl-6">{r.no}</TableCell>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right">
                      {r.kode === "11" ? (
                        <AngkaInput
                          value={biayaLain}
                          onValueChange={setBiayaLain}
                          className="ml-auto h-8 w-48"
                          aria-label="Biaya lain-lain (Rp)"
                        />
                      ) : (
                        <span className="font-mono tabular-nums">{formatAngka(D[r.kode!], 2)}</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {r.persenInput ? (
                        <PersenInput
                          value={persen[r.persenInput]}
                          onChange={(v) => setPersen((p) => ({ ...p, [r.persenInput!]: v }))}
                          label={r.label}
                        />
                      ) : (
                        <span className="font-mono text-muted-foreground tabular-nums">{persenBaris(r.kode!)}</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              )}
              <BarisTotal label="Quick Count (Non PPN)" nilai={D["25"]} />
              <TableRow>
                <TableCell className="pl-6" />
                <TableCell className="font-medium">PPN</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatAngka(D["26"], 2)}</TableCell>
                <TableCell className="pr-6 text-right">
                  <PersenInput
                    value={persen["26"]}
                    onChange={(v) => setPersen((p) => ({ ...p, "26": v }))}
                    label="PPN"
                  />
                </TableCell>
              </TableRow>
              <BarisTotal
                label="Quick Count Estimate"
                nilai={D["27"]}
                persen={tampilPersen(hasil.persenTampil["27"])}
                utama
              />
              {/* Bobot (D29) & Jumlah Penawaran (D30) tidak ditampilkan, tapi tetap dihitung di hitungQuickCount:
                  D30 jadi dasar semua nilai persen di atas. */}
            </TableBody>
          </Table>
          <div className="flex flex-col items-end gap-2 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Sudah selesai mengisi? Unduh hasil quick count.</p>
            <Button onClick={eksporHasil} disabled={mengekspor !== null}>
              {mengekspor === "hasil" ? <Loader2 className="animate-spin" /> : <Download />}
              Ekspor Quick Count (.xlsx)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function InfoBlok({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
      <span className="mt-0.5 text-blue-700 [&_svg]:size-4">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-semibold" title={value}>
          {value}
        </p>
      </div>
    </div>
  )
}

function PersenInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="ml-auto flex w-28 items-center gap-1">
      <Input
        inputMode="decimal"
        value={value}
        placeholder="0.00"
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
        className="h-8 text-right tabular-nums"
        aria-label={`Persen ${label}`}
      />
      <span className="text-muted-foreground">%</span>
    </div>
  )
}

function BarisTotal({
  label,
  nilai,
  persen,
  utama,
}: {
  label: string
  nilai: number
  persen?: string
  utama?: boolean
}) {
  return (
    <TableRow
      className={cn(
        "font-bold hover:bg-transparent",
        utama ? "bg-blue-50 text-blue-900 hover:bg-blue-50" : "bg-muted/30"
      )}
    >
      <TableCell className="pl-6" />
      <TableCell>{label}</TableCell>
      <TableCell className="text-right font-mono tabular-nums">{formatAngka(nilai, 2)}</TableCell>
      <TableCell className="pr-6 text-right font-mono tabular-nums">{persen}</TableCell>
    </TableRow>
  )
}
