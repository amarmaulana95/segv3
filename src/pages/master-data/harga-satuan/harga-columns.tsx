import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format"
import type { HargaSatuan } from "@/types/master"

interface HargaColumnActions {
  onCopy: (row: HargaSatuan) => void
  onEdit: (row: HargaSatuan) => void
  onDelete: (row: HargaSatuan) => void
}

function namaUser(value: string | null) {
  return value ? (
    <span className="block truncate" title={value}>
      {value}
    </span>
  ) : (
    <span className="text-muted-foreground">-</span>
  )
}

// id kolom = nama kolom sort di backend.
export function hargaColumns({ onCopy, onEdit, onDelete }: HargaColumnActions): ColumnDef<HargaSatuan>[] {
  return [
    {
      accessorKey: "kode",
      header: "Kode",
      meta: { width: 100 },
      cell: ({ row }) => <span className="font-semibold">{row.original.kode}</span>,
    },
    { accessorKey: "nama", header: "Uraian", meta: { width: 260 } },
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
      meta: { width: 240 },
      cell: ({ row }) => row.original.keterangan || <span className="text-muted-foreground">-</span>,
    },
    {
      accessorKey: "unit",
      header: "Satuan",
      meta: { width: 100, className: "text-center" },
      cell: ({ row }) => (row.original.unit ? <Badge variant="outline">{row.original.unit}</Badge> : "-"),
    },
    {
      accessorKey: "price",
      header: "Harga (Rp)",
      meta: { width: 150, className: "text-right" },
      cell: ({ row }) => <span className="font-mono tabular-nums">{formatMoney(row.original.price)}</span>,
    },
    {
      accessorKey: "created_by",
      header: "Created By",
      meta: { width: 130 },
      cell: ({ row }) => namaUser(row.original.created_by),
    },
    {
      accessorKey: "updated_by",
      header: "Updated By",
      meta: { width: 130 },
      cell: ({ row }) => namaUser(row.original.updated_by),
    },
    {
      id: "aksi",
      header: "Aksi",
      enableSorting: false,
      meta: { width: 130, className: "text-center" },
      cell: ({ row }) => (
        <div className="flex justify-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Tambah harga (copy)"
            onClick={() => onCopy(row.original)}
          >
            <Plus />
          </Button>
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
