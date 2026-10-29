import type { ExpandedState, Updater } from "@tanstack/react-table"
import { Plus, Search, Upload } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { DataTable } from "@/components/data-table/data-table"
import { useServerTable } from "@/components/data-table/use-server-table"
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
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { analisaColumns } from "@/pages/master-data/analisa/analisa-columns"
import { AnalisaDetailPanel } from "@/pages/master-data/analisa/analisa-detail-panel"
import { AnalisaFormDialog } from "@/pages/master-data/analisa/analisa-form-dialog"
import { AnalisaImporDialog } from "@/pages/master-data/analisa/analisa-impor-dialog"
import { lokasiLabel, useMasterOptions } from "@/pages/master-data/use-master-options"
import { apiErrorMessage } from "@/services/api"
import { masterService } from "@/services/master-service"
import type { AnalisaRow } from "@/types/master"

// Radix Select tidak menerima value kosong, jadi "Semua ..." memakai nilai ini.
const SEMUA = "__semua__"
const PAGE_SIZES = [10, 25, 50, 100]

export function AnalisaPage() {
  const { options, reload: reloadOptions } = useMasterOptions()
  // Dari Rekap Analisa: ?search=KODE&expand=ID -> isi pencarian & buka rincian baris itu
  // (expand=KODE juga diterima, membuka baris pertama dengan kode itu).
  const [searchParams] = useSearchParams()
  const [expandAwal] = useState(() => searchParams.get("expand") ?? "")

  const [filterTahun, setFilterTahun] = useState(SEMUA)
  const [filterLokasi, setFilterLokasi] = useState(SEMUA)
  const table = useServerTable({
    fetcher: masterService.listAnalisa,
    filters: {
      filter_tahun: filterTahun === SEMUA ? undefined : filterTahun,
      filter_lokasi: filterLokasi === SEMUA ? undefined : filterLokasi,
    },
    defaultSorting: [{ id: "kode", desc: false }],
    initialSearch: searchParams.get("search") ?? "",
    errorMessage: "Gagal memuat data analisa.",
  })
  const { resetPage, reload: reloadTable } = table

  // null = belum diubah user: baris dari ?expand= dibuka otomatis.
  const [expandedUser, setExpandedUser] = useState<ExpandedState | null>(null)
  const autoExpandId = expandAwal
    ? (table.rows.find((row) => row.id === expandAwal) ?? table.rows.find((row) => row.kode === expandAwal))?.id
    : undefined
  const expanded: ExpandedState = expandedUser ?? (autoExpandId ? { [autoExpandId]: true } : {})
  const onExpandedChange = (updater: Updater<ExpandedState>) =>
    setExpandedUser(typeof updater === "function" ? updater(expanded) : updater)

  const [form, setForm] = useState<{ open: boolean; key: number; id?: string }>({ open: false, key: 0 })
  const [imporOpen, setImporOpen] = useState(false)
  const [hapusRow, setHapusRow] = useState<AnalisaRow | null>(null)

  const bukaForm = useCallback((id?: string) => setForm((f) => ({ open: true, key: f.key + 1, id })), [])

  const columns = useMemo(
    () => analisaColumns({ onEdit: (row) => bukaForm(row.id), onDelete: setHapusRow }),
    [bukaForm]
  )

  // Setelah data berubah, rincian yang terbuka ditutup (isinya bisa berubah) dan filter ikut diperbarui.
  const afterChange = useCallback(() => {
    setExpandedUser({})
    reloadTable()
    reloadOptions()
  }, [reloadTable, reloadOptions])

  async function handleHapus() {
    if (!hapusRow) return
    try {
      const res = await masterService.hapusAnalisa(hapusRow.id)
      if (res.success) {
        toast.success(res.message)
        afterChange()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal menghapus analisa"))
    } finally {
      setHapusRow(null)
    }
  }

  return (
    <>
      <Card className="gap-0 py-0">
        <div className="border-b px-6 py-5">
          <h2 className="text-base font-semibold">Data Analisa (AHSP)</h2>
        </div>

        <div className="flex flex-col gap-3 border-b px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={table.search}
                onChange={(e) => table.setSearch(e.target.value)}
                placeholder="Cari kode atau uraian pekerjaan..."
                className="h-9 pl-8"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Tampilkan
              <Select
                value={String(table.pagination.pageSize)}
                onValueChange={(value) => table.setPagination({ pageIndex: 0, pageSize: Number(value) })}
              >
                <SelectTrigger className="h-9! w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              data
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filterTahun}
              onValueChange={(value) => {
                setFilterTahun(value)
                resetPage()
              }}
            >
              <SelectTrigger className="h-9! min-w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEMUA}>Semua Tahun</SelectItem>
                {options?.analisa_tahun.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterLokasi}
              onValueChange={(value) => {
                setFilterLokasi(value)
                resetPage()
              }}
            >
              <SelectTrigger className="h-9! min-w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value={SEMUA}>Semua Lokasi</SelectItem>
                {options?.analisa_lokasi.map((lokasi) => (
                  <SelectItem key={lokasi.kode} value={lokasi.kode}>
                    {lokasiLabel(lokasi)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="lg" onClick={() => bukaForm()}>
              <Plus />
              Buat Analisa
            </Button>
            <Button size="lg" variant="outline" onClick={() => setImporOpen(true)}>
              <Upload />
              Impor
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={table.rows}
          total={table.total}
          pagination={table.pagination}
          onPaginationChange={table.setPagination}
          sorting={table.sorting}
          onSortingChange={table.setSorting}
          loading={table.loading}
          emptyText={
            table.debouncedSearch || filterTahun !== SEMUA || filterLokasi !== SEMUA
              ? "Data tidak ditemukan."
              : "Belum ada data analisa."
          }
          minWidth={1100}
          itemLabel="analisa"
          getRowId={(row) => row.id}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          renderSubRow={(row) => <AnalisaDetailPanel id={row.original.id} />}
        />
      </Card>

      <AnalisaFormDialog
        key={form.key}
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        analisaId={form.id}
        onSaved={afterChange}
      />

      <AnalisaImporDialog
        key={imporOpen ? "impor-open" : "impor-closed"}
        open={imporOpen}
        onOpenChange={setImporOpen}
        onImported={afterChange}
      />

      <AlertDialog open={!!hapusRow} onOpenChange={(open) => !open && setHapusRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus analisa?</AlertDialogTitle>
            <AlertDialogDescription>
              Analisa {hapusRow?.kode} ({hapusRow?.nama}, {hapusRow?.lokasi} {hapusRow?.tahun}) beserta seluruh
              rinciannya akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleHapus}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
