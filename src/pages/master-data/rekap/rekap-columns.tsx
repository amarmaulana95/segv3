import type { ColumnDef } from "@tanstack/react-table"
import { Eye } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/menu"
import { formatMoney } from "@/lib/format"
import { toQuery } from "@/services/api"
import type { AnalisaRow } from "@/types/master"

const strip = (value: string | number | null) =>
  value === null || value === "" ? <span className="text-muted-foreground">-</span> : value

const uang = (value: number, tebal = false) => (
  <span className={tebal ? "font-mono font-semibold tabular-nums" : "font-mono tabular-nums"}>{formatMoney(value)}</span>
)

// id kolom = nama kolom sort di backend.
export const rekapColumns: ColumnDef<AnalisaRow>[] = [
  {
    accessorKey: "kode",
    header: "Kode",
    meta: { width: 110 },
    cell: ({ row }) => <span className="font-semibold">{row.original.kode}</span>,
  },
  { accessorKey: "nama", header: "Uraian Pekerjaan", meta: { width: 220 } },
  { accessorKey: "unit", header: "Sat", meta: { width: 70 }, cell: ({ row }) => strip(row.original.unit) },
  { accessorKey: "tahun", header: "Tahun", meta: { width: 80 }, cell: ({ row }) => strip(row.original.tahun) },
  { accessorKey: "lokasi", header: "Lokasi", meta: { width: 85 }, cell: ({ row }) => strip(row.original.lokasi) },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
    meta: { width: 160 },
    cell: ({ row }) => strip(row.original.keterangan),
  },
  {
    accessorKey: "material",
    header: "A. Material (Rp)",
    meta: { width: 150, className: "text-right" },
    cell: ({ row }) => uang(row.original.material),
  },
  {
    accessorKey: "upah",
    header: "B. Upah (Rp)",
    meta: { width: 140, className: "text-right" },
    cell: ({ row }) => uang(row.original.upah),
  },
  {
    accessorKey: "alat",
    header: "C. Alat (Rp)",
    meta: { width: 140, className: "text-right" },
    cell: ({ row }) => uang(row.original.alat),
  },
  {
    accessorKey: "subkontraktor",
    header: "D. Subkontraktor (Rp)",
    meta: { width: 180, className: "text-right" },
    cell: ({ row }) => uang(row.original.subkontraktor),
  },
  {
    accessorKey: "total",
    header: "Total Analisa (Rp)",
    meta: { width: 170, className: "text-right" },
    cell: ({ row }) => uang(row.original.total, true),
  },
  {
    accessorKey: "created_by",
    header: "Created By",
    meta: { width: 130 },
    cell: ({ row }) => strip(row.original.created_by),
  },
  {
    accessorKey: "updated_by",
    header: "Updated By",
    meta: { width: 130 },
    cell: ({ row }) => strip(row.original.updated_by),
  },
  {
    id: "aksi",
    header: "Aksi",
    enableSorting: false,
    meta: { width: 80, className: "text-center print:hidden" },
    // Buka halaman Analisa dengan rincian baris ini langsung terbuka. expand pakai id karena
    // kode yang sama bisa dipakai di lokasi/tahun lain.
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="icon-sm" title="Lihat detail">
        <Link to={`${ROUTES.masterAnalisa}${toQuery({ search: row.original.kode, expand: row.original.id })}`}>
          <Eye />
        </Link>
      </Button>
    ),
  },
]
