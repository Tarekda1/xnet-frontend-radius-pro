import React from "react";
import {
  flexRender,
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  RowSelectionState,
  OnChangeFn,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  CalendarIcon,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  DollarSign,
  Eye,
  Trash2,
  XCircle,
} from "lucide-react";
import type { ExternalInvoice } from "@/types/api";
import { HeaderButton } from "./ui/HeaderButton";

/* ── colour map for provider pills ───────────────────────── */
const providerStyles = {
  idm: { color: "text-blue-700", bg: "bg-blue-100" },
  isp11s: { color: "text-violet-700", bg: "bg-violet-100" },
  myisp: { color: "text-red-700", bg: "bg-red-100" },
  terra: { color: "text-blue-700", bg: "bg-blue-100" },
  mobi: { color: "text-blue-700", bg: "bg-blue-100" },
  tisp: { color: "text-orange-700", bg: "bg-orange-100" },
  "tisp-2": { color: "text-green-700", bg: "bg-green-100" },
  default: { color: "text-gray-700", bg: "bg-gray-100" },
} as const;

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200];

type Props = {
  invoices: ExternalInvoice[];
  /* pagination */
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onPageSizeChange: (size: number) => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  totalItems: number;
  /* selection / sorting */
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  /* actions */
  onSetPaid: (id: number) => void;
  onViewInvoice: (inv: ExternalInvoice) => void;
  onDeleteInvoice: (id: number) => void;
  /* other */
  search: string;
  key?: number;
  hideBulkActions?: boolean;
};

const DesktopTable: React.FC<Props> = ({
  invoices,
  currentPage,
  totalPages,
  pageSize,
  onNextPage,
  onPrevPage,
  onPageSizeChange,
  onFirstPage,
  onLastPage,
  totalItems,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  onSetPaid,
  onViewInvoice,
  onDeleteInvoice,
}) => {
  /* ── column definitions ─────────────────────── */
  const columns = React.useMemo<ColumnDef<ExternalInvoice>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <HeaderButton column={column}>ID</HeaderButton>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold pl-4">#{row.original.id}</span>
        ),
      },
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
            className="p-0! ml-0!"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
            className="p-0! ml-0!"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "username",
        header: ({ column }) => (
          <HeaderButton column={column}>Username</HeaderButton>
        ),
        cell: ({ row }) => <span className="font-medium">{row.original.username}</span>,
      },
      {
        accessorKey: "fullName",
        header: ({ column }) => (
          <HeaderButton column={column}>Full&nbsp;Name</HeaderButton>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-blue-600">{row.original.fullName}</span>
        ),
      },
      {
        accessorKey: "provider",
        header: ({ column }) => (
          <HeaderButton column={column}>Provider</HeaderButton>
        ),
        cell: ({ row }) => {
          const key = (row.original.provider ?? "").toLowerCase() as keyof typeof providerStyles;
          const { color, bg } = providerStyles[key] ?? providerStyles.default;
          return (
            <span className={`${color} ${bg} px-2 py-1 rounded-full text-xs font-medium`}>
              {row.original.provider}
            </span>
          );
        },
      },
      {
        accessorKey: "paidAt",
        header: ({ column }) => (
          <HeaderButton column={column}>Paid&nbsp;At</HeaderButton>
        ),
        cell: ({ row }) =>
          row.original.paidAt ? (
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 text-green-500 mr-1" />
              {new Date(row.original.paidAt).toLocaleString()}
            </div>
          ) : (
            <span className="text-gray-400">Not&nbsp;paid</span>
          ),
      },
      {
        accessorKey: "modifiedBy",
        header: ({ column }) => (
          <HeaderButton column={column}>Modified By</HeaderButton>
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.modifiedBy || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: "billingMonth",
        header: ({ column }) => (
          <HeaderButton column={column}>Billing&nbsp;Month</HeaderButton>
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 text-gray-500 mr-1" />
            {new Date(row.original.billingMonth).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <HeaderButton column={column}>Amount</HeaderButton>
        ),
        cell: ({ row }) => (
          <div className="flex items-center font-semibold">
            <DollarSign className="h-4 w-4 text-green-500 mr-1" />
            {row.original.amount.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <HeaderButton column={column}>Status</HeaderButton>
        ),
        cell: ({ row }) => {
          switch (row.original.status) {
            case "paid":
              return (
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1 text-white" />
                  <span className="text-white">Paid</span>
                </Badge>
              );
            case "pending":
              return (
                <Badge variant="outline" className="bg-yellow-500 hover:bg-yellow-600 border-yellow-500">
                  <Clock className="h-3 w-3 mr-1 text-white" />
                  <span className="text-white">Pending</span>
                </Badge>
              );
            default:
              return (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1 text-white" />
                  <span className="text-white">Unpaid</span>
                </Badge>
              );
          }
        },
        sortingFn: (rowA, rowB, columnId) => {
          const statusOrder = { paid: 2, pending: 1, unpaid: 0 };
          const a = statusOrder[rowA.original.status as keyof typeof statusOrder] ?? 0;
          const b = statusOrder[rowB.original.status as keyof typeof statusOrder] ?? 0;
          return a - b;  // Sort by status priority
        },
      },
      {
        id: "details",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onViewInvoice(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
      {
        id: "setPaid",
        header: "Set as Paid",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            disabled={row.original.status === "paid"}
            onClick={() => onSetPaid(row.original.id)}
            className={
              row.original.status === "paid"
                ? ""
                : "text-green-600 hover:text-green-700 hover:bg-green-50"
            }
          >
            <Check className="h-4 w-4 mr-1" /> Set
          </Button>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex space-x-2">
            {/* Existing buttons */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeleteInvoice(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onSetPaid, onViewInvoice]
  );

  /* ── table instance ───────────────────────── */
  const table = useReactTable({
    data: invoices,
    columns,
    state: { sorting, rowSelection },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange,
    enableRowSelection: true,
    onRowSelectionChange,
    manualPagination: true,
  });

  return (
    <>
      <div className="min-w-[768px]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="py-2 px-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    i % 2 ? "bg-gray-50" : "bg-white",
                    "hover:bg-gray-100",
                    row.getIsSelected() && "bg-primary/50"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-left">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced pagination footer */}
      <div className="flex items-center justify-between py-4 px-2 border-t">
        {/* Items per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>

        {/* Items range and total */}
        <div className="flex-1 text-center text-sm text-muted-foreground">
          Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
          <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of{" "}
          <span className="font-medium">{totalItems}</span> items
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onFirstPage}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 px-2">
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onLastPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

/* ── helper for sortable headers ───────────────────────── */
// const HeaderButton: React.FC<{ column: any }> = ({ column, children }) => (
//   <Button
//     variant="ghost"
//     onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//     className="w-full justify-start hover:bg-gray-100"
//   >
//     {children}
//     <ArrowUpDown className="ml-1 h-4 w-4" />
//   </Button>
// );

export default React.memo(DesktopTable);
