import { Download, Loader2, Printer, Search } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { DataTable } from "@/components/data-table/data-table"
import { useServerTable } from "@/components/data-table/use-server-table"
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
import { rekapColumns } from "@/pages/master-data/rekap/rekap-columns"
import { lokasiLabel, useMasterOptions } from "@/pages/master-data/use-master-options"
import { apiErrorMessage } from "@/services/api"
import { masterService } from "@/services/master-service"

// Radix Select tidak menerima value kosong, jadi "Semua Lokasi" memakai nilai ini.
const SEMUA = "__semua__"

export function RekapAnalisaPage() {
  const { options } = useMasterOptions()
  const [filterLokasi, setFilterLokasi] = useState(SEMUA)
  const table = useServerTable({
    fetcher: masterService.listAnalisa,
    filters: { filter_lokasi: filterLokasi === SEMUA ? undefined : filterLokasi },
    defaultSorting: [{ id: "kode", desc: false }],
    errorMessage: "Gagal memuat rekap analisa.",
  })
  const [mengekspor, setMengekspor] = useState(false)

  // Ekspor semua data sesuai pencarian/filter/urutan saat ini (bukan hanya halaman aktif).
  async function handleEkspor() {
    setMengekspor(true)
    try {
      await masterService.eksporRekapAnalisa(table.query)
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal mengekspor rekap analisa"))
    } finally {
      setMengekspor(false)
    }
  }

  return (
    <Card className="gap-0 py-0 print:rounded-none print:ring-0">
      <div className="border-b px-6 py-5">
        <h2 className="text-base font-semibold">Rekap Analisa</h2>
      </div>

      <div className="flex flex-col gap-3 border-b px-6 py-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div className="relative w-full md:w-96">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={table.search}
            onChange={(e) => table.setSearch(e.target.value)}
            placeholder="Cari kode atau nama pekerjaan..."
            className="h-9 pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filterLokasi}
            onValueChange={(value) => {
              setFilterLokasi(value)
              table.resetPage()
            }}
          >
            <SelectTrigger className="h-9! min-w-52">
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
          <Button size="lg" variant="outline" onClick={handleEkspor} disabled={mengekspor}>
            {mengekspor ? <Loader2 className="animate-spin" /> : <Download />}
            {mengekspor ? "Mengekspor..." : "Ekspor Excel"}
          </Button>
          <Button size="lg" variant="outline" onClick={() => window.print()}>
            <Printer />
            Cetak
          </Button>
        </div>
      </div>

      <DataTable
        columns={rekapColumns}
        data={table.rows}
        total={table.total}
        pagination={table.pagination}
        onPaginationChange={table.setPagination}
        sorting={table.sorting}
        onSortingChange={table.setSorting}
        loading={table.loading}
        emptyText={
          table.debouncedSearch || filterLokasi !== SEMUA ? "Data analisa tidak ditemukan." : "Belum ada data analisa."
        }
        minWidth={1700}
        itemLabel="analisa"
      />
    </Card>
  )
}
