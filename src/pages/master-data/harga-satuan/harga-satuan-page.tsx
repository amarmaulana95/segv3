import { Plus, Search, Upload } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
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
import { hargaColumns } from "@/pages/master-data/harga-satuan/harga-columns"
import { HargaFormDialog, type HargaFormMode } from "@/pages/master-data/harga-satuan/harga-form-dialog"
import { HargaImporDialog } from "@/pages/master-data/harga-satuan/harga-impor-dialog"
import { lokasiLabel, useMasterOptions } from "@/pages/master-data/use-master-options"
import { masterService } from "@/services/master-service"
import type { HargaSatuan, MasterKomponen } from "@/types/master"

// Radix Select tidak menerima value kosong, jadi "Semua ..." memakai nilai ini.
const SEMUA = "__semua__"
const PAGE_SIZES = [10, 25, 50, 100]

export function HargaSatuanPage() {
  const { options, reload: reloadOptions } = useMasterOptions()
  const [komponen, setKomponen] = useState<MasterKomponen[]>([])

  const [filterTipe, setFilterTipe] = useState(SEMUA)
  const [filterLokasi, setFilterLokasi] = useState(SEMUA)
  const [filterTahun, setFilterTahun] = useState(SEMUA)
  const table = useServerTable({
    fetcher: masterService.listHarga,
    filters: {
      filter_tipe: filterTipe === SEMUA ? undefined : filterTipe,
      filter_lokasi: filterLokasi === SEMUA ? undefined : filterLokasi,
      filter_tahun: filterTahun === SEMUA ? undefined : filterTahun,
    },
    defaultSorting: [{ id: "kode", desc: false }],
    errorMessage: "Gagal memuat data harga satuan.",
  })
  const { resetPage, reload: reloadTable } = table

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<HargaFormMode>({ type: "add" })
  const [formKey, setFormKey] = useState(0)
  const [imporOpen, setImporOpen] = useState(false)
  const [hapusRow, setHapusRow] = useState<HargaSatuan | null>(null)

  const loadKomponen = useCallback(() => {
    masterService
      .komponen()
      .then(setKomponen)
      .catch(() => toast.error("Gagal memuat daftar komponen."))
  }, [])

  useEffect(() => {
    loadKomponen()
  }, [loadKomponen])

  const bukaForm = useCallback((mode: HargaFormMode) => {
    setFormMode(mode)
    setFormKey((k) => k + 1)
    setFormOpen(true)
  }, [])

  const columns = useMemo(
    () =>
      hargaColumns({
        onCopy: (row) => bukaForm({ type: "copy", row }),
        onEdit: (row) => bukaForm({ type: "edit", row }),
        onDelete: setHapusRow,
      }),
    [bukaForm]
  )

  // Setelah data berubah, filter & daftar komponen ikut diperbarui.
  const afterChange = useCallback(() => {
    reloadTable()
    reloadOptions()
    loadKomponen()
  }, [reloadTable, reloadOptions, loadKomponen])

  async function handleHapus() {
    if (!hapusRow) return
    try {
      const res = await masterService.hapusHarga(hapusRow.id)
      if (res.success) {
        toast.success(res.message)
        afterChange()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Gagal menghapus data.")
    } finally {
      setHapusRow(null)
    }
  }

  return (
    <>
      <Card className="gap-0 py-0">
        <div className="border-b px-6 py-5">
          <h2 className="text-base font-semibold">
            Harga Satuan — {filterTipe === SEMUA ? "Semua Tipe" : filterTipe}
          </h2>
        </div>

        <div className="flex flex-col gap-3 border-b px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={table.search}
                onChange={(e) => table.setSearch(e.target.value)}
                placeholder="Cari kode atau uraian..."
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
              value={filterTipe}
              onValueChange={(value) => {
                setFilterTipe(value)
                resetPage()
              }}
            >
              <SelectTrigger className="h-9! min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEMUA}>Semua Tipe</SelectItem>
                {options?.categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
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
                {options?.locations.map((lokasi) => (
                  <SelectItem key={lokasi.kode} value={lokasi.kode}>
                    {lokasiLabel(lokasi)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {options?.years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="lg" onClick={() => bukaForm({ type: "add" })}>
              <Plus />
              Tambah Item
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
            table.debouncedSearch || filterTipe !== SEMUA || filterLokasi !== SEMUA || filterTahun !== SEMUA
              ? "Data tidak ditemukan."
              : "Belum ada data harga satuan."
          }
          minWidth={1400}
        />
      </Card>

      <HargaFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        komponen={komponen}
        lokasi={options?.locations ?? []}
        onSaved={afterChange}
      />

      <HargaImporDialog
        key={imporOpen ? "impor-open" : "impor-closed"}
        open={imporOpen}
        onOpenChange={setImporOpen}
        lokasi={options?.locations ?? []}
        onImported={afterChange}
      />

      <AlertDialog open={!!hapusRow} onOpenChange={(open) => !open && setHapusRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus harga satuan?</AlertDialogTitle>
            <AlertDialogDescription>
              Harga satuan {hapusRow?.kode} ({hapusRow?.nama}, {hapusRow?.lokasi} {hapusRow?.tahun}) akan dihapus
              permanen.
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
