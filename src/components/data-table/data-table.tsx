import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react"
import { Fragment, type ReactNode } from "react"

import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string
    width?: number
  }
}

interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[]
  data: TData[]
  total: number
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  loading?: boolean
  emptyText?: string
  minWidth?: number
  // Kata untuk info paging, mis. "Menampilkan 1–10 dari 12 analisa".
  itemLabel?: string
  // Baris yang bisa dibuka: isi rincian di bawah baris (expanded dikontrol dari luar).
  getRowId?: (row: TData) => string
  renderSubRow?: (row: Row<TData>) => ReactNode
  expanded?: ExpandedState
  onExpandedChange?: OnChangeFn<ExpandedState>
}

// Tabel server-side: paging & sorting dikirim ke backend, tabel hanya menampilkan halaman aktif.
export function DataTable<TData>({
  columns,
  data,
  total,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  loading = false,
  emptyText = "Belum ada data.",
  minWidth,
  itemLabel,
  getRowId,
  renderSubRow,
  expanded,
  onExpandedChange,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    state: { pagination, sorting, ...(expanded !== undefined && { expanded }) },
    onPaginationChange,
    onSortingChange,
    onExpandedChange,
    getRowId,
    getRowCanExpand: () => !!renderSubRow,
    manualPagination: true,
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    sortDescFirst: false,
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <div className="relative">
        <Table className="table-fixed" style={{ minWidth }}>
          <colgroup>
            {table.getVisibleLeafColumns().map((column) => (
              <col key={column.id} style={{ width: column.columnDef.meta?.width }} />
            ))}
          </colgroup>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      className={cn("h-12 px-3 font-semibold first:pl-6 last:pr-6", meta?.className)}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 hover:text-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowUpDown className="size-3.5 text-muted-foreground/60" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow data-state={row.getIsExpanded() ? "selected" : undefined}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-3 py-3 whitespace-normal first:pl-6 last:pr-6",
                          cell.column.columnDef.meta?.className
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {renderSubRow && row.getIsExpanded() && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={row.getVisibleCells().length} className="p-0 whitespace-normal">
                        {renderSubRow(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {loading ? "Memuat data..." : emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {loading && data.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <span className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
              <Loader2 className="size-4 animate-spin" />
              Memuat data...
            </span>
          </div>
        )}
      </div>

      <DataTablePagination table={table} total={total} itemLabel={itemLabel} />
    </div>
  )
}
