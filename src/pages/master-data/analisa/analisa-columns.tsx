import type { ColumnDef } from "@tanstack/react-table"
import { ChevronRight, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AnalisaRow } from "@/types/master"

interface AnalisaColumnActions {
  onEdit: (row: AnalisaRow) => void
  onDelete: (row: AnalisaRow) => void
}

// id kolom = nama kolom sort di backend.
export function analisaColumns({ onEdit, onDelete }: AnalisaColumnActions): ColumnDef<AnalisaRow>[] {
  return [
    {
      id: "expand",
      header: "",
      enableSorting: false,
      meta: { width: 64 },
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="icon-sm"
          title={row.getIsExpanded() ? "Tutup rincian" : "Lihat rincian"}
          aria-expanded={row.getIsExpanded()}
          onClick={row.getToggleExpandedHandler()}
        >
          <ChevronRight className={cn("transition-transform", row.getIsExpanded() && "rotate-90")} />
        </Button>
      ),
    },
    {
      accessorKey: "kode",
      header: "Kode",
      meta: { width: 110 },
      cell: ({ row }) => <span className="font-semibold">{row.original.kode}</span>,
    },
    { accessorKey: "nama", header: "Uraian Pekerjaan", meta: { width: 240 } },
    {
      accessorKey: "tahun",
      header: "Tahun",
      meta: { width: 100, className: "text-center" },
      cell: ({ row }) =>
        row.original.tahun ? <Badge variant="secondary">{row.original.tahun}</Badge> : "-",
    },
    {
      accessorKey: "lokasi",
      header: "Lokasi",
      meta: { width: 100, className: "text-center" },
      cell: ({ row }) =>
        row.original.lokasi ? (
          <Badge className="border-blue-200 bg-blue-50 text-blue-700">{row.original.lokasi}</Badge>
        ) : (
          "-"
        ),
    },
    {
      accessorKey: "keterangan",
      header: "Keterangan",
      // Tanpa lebar tetap: mengisi sisa ruang supaya tabel (dan rinciannya) muat di layar laptop.
      cell: ({ row }) => row.original.keterangan || <span className="text-muted-foreground">-</span>,
    },
    {
      accessorKey: "unit",
      header: "Satuan",
      meta: { width: 100, className: "text-center" },
      cell: ({ row }) => (row.original.unit ? <Badge variant="outline">{row.original.unit}</Badge> : "-"),
    },
    {
      accessorKey: "total",
      header: "Total (Rp)",
      meta: { width: 160, className: "text-right" },
      cell: ({ row }) => (
        <span className="font-mono font-semibold tabular-nums">{formatMoney(row.original.total)}</span>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      enableSorting: false,
      meta: { width: 110, className: "text-center" },
      cell: ({ row }) => (
        <div className="flex justify-center gap-0.5">
          <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => onEdit(row.original)}>
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Hapus"
            className="hover:text-destructive"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]
}
