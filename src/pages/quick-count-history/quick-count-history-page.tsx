import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
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
import { ROUTES } from "@/config/menu"
import { formatAngka, formatTanggal } from "@/lib/format"
import { apiErrorMessage } from "@/services/api"
import { tenderService } from "@/services/tender-service"
import type { ProjectHistory } from "@/types/tender"

export function QuickCountHistoryPage() {
  const table = useServerTable({
    fetcher: tenderService.listHistory,
    defaultSorting: [{ id: "created_at", desc: true }],
    errorMessage: "Gagal memuat history quick count.",
  })
  const canDelete = table.response?.can_delete ?? false
  const [hapusRow, setHapusRow] = useState<ProjectHistory | null>(null)
  const nomorAwal = table.pagination.pageIndex * table.pagination.pageSize

  // id kolom = nama kolom sort di backend.
  const columns = useMemo<ColumnDef<ProjectHistory>[]>(
    () => [
      {
        id: "no",
        header: "No",
        enableSorting: false,
        meta: { width: 64 },
        cell: ({ row }) => nomorAwal + row.index + 1,
      },
      {
        accessorKey: "name",
        header: "Project Name",
        cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
      },
      {
        accessorKey: "location",
        header: "Location",
        meta: { width: 180 },
        cell: ({ row }) => row.original.location ?? <span className="text-muted-foreground">-</span>,
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        meta: { width: 140 },
        cell: ({ row }) => formatTanggal(row.original.created_at),
      },
      {
        accessorKey: "cost",
        header: "Total Cost (IDR)",
        meta: { width: 200, className: "text-right" },
        cell: ({ row }) => (
          <span className="font-mono font-semibold tabular-nums">Rp {formatAngka(row.original.cost)}</span>
        ),
      },
      {
        accessorKey: "created_by",
        header: "Created By",
        meta: { width: 170 },
        cell: ({ row }) => row.original.created_by ?? <span className="text-muted-foreground">-</span>,
      },
      {
        id: "aksi",
        header: "Detail",
        enableSorting: false,
        meta: { width: 100, className: "text-center" },
        cell: ({ row }) => (
          <div className="flex justify-center gap-0.5">
            <Button asChild variant="ghost" size="icon-sm" title="Lihat detail">
              <Link to={`${ROUTES.quickCountHistory}/${row.original.uuid}`}>
                <Eye />
              </Link>
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                title="Hapus"
                className="hover:text-destructive"
                onClick={() => setHapusRow(row.original)}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [nomorAwal, canDelete]
  )

  async function handleHapus() {
    if (!hapusRow) return
    try {
      const res = await tenderService.hapusProyek(hapusRow.uuid)
      if (res.success) {
        toast.success(res.message)
        table.reload()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal menghapus proyek"))
    } finally {
      setHapusRow(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quick Count History</h1>
        <p className="text-sm text-muted-foreground">Project Estimate History</p>
      </div>

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-96">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={table.search}
              onChange={(e) => table.setSearch(e.target.value)}
              placeholder="Cari nama proyek atau lokasi..."
              className="h-9 pl-8"
            />
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
          emptyText={table.debouncedSearch ? "Proyek tidak ditemukan." : "Belum ada history quick count."}
          minWidth={960}
          itemLabel="proyek"
        />
      </Card>

      <AlertDialog open={!!hapusRow} onOpenChange={(open) => !open && setHapusRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus proyek estimasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Proyek "{hapusRow?.name}" beserta seluruh header dan item estimasinya akan dihapus permanen.
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
    </div>
  )
}
