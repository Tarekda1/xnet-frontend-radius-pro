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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CalendarIcon,
  BellRing,
  Check,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Eye,
  Mail,
  SlidersHorizontal,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import type { ExternalInvoice } from "@/types/api";
import { HeaderButton } from "./ui/HeaderButton";
import { notify } from "@/lib/notify";
import TableToolbar from "@/components/TableToolbar";
import TablePager from "@/components/TablePager";
import TableRowActions from "@/components/TableRowActions";
import { deriveWorkflowStage, getWorkflowLabel, getWorkflowTone, type ReconciliationFlag, type WorkflowStage } from "@/lib/externalInvoiceInsights";

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

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200,500];

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
  /** If true, parent renders the pager (useful for mobile+desktop unified pager). */
  hidePager?: boolean;
  /* selection / sorting */
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  /* actions */
  onSetPaid?: (id: number) => void;
  onUnpay?: (id: number) => void;
  onSendReminder?: (id: number) => void;
  onSetWorkflowStage?: (id: number, stage: WorkflowStage) => void;
  onViewInvoice: (inv: ExternalInvoice) => void;
  onDeleteInvoice: (id: number) => void;
  reconciliationMode?: boolean;
  reconciliationFlags?: Map<number, ReconciliationFlag[]>;
  workflowGraceDays?: number;
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
  hidePager = false,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  onSetPaid,
  onUnpay,
  onSendReminder,
  onSetWorkflowStage,
  onViewInvoice,
  onDeleteInvoice,
  reconciliationMode,
  reconciliationFlags,
  workflowGraceDays = 7,
}) => {
  /* ── column definitions ─────────────────────── */
  const columns = React.useMemo<ColumnDef<ExternalInvoice>[]>(
    () => {
      const cols: ColumnDef<ExternalInvoice>[] = [
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
          <HeaderButton column={column}>Last Action</HeaderButton>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.modifiedBy || 'N/A'}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.modifiedAt ? new Date(row.original.modifiedAt).toLocaleString() : "—"}
            </span>
          </div>
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
          const status = row.original.status;
          const canPayHere = Boolean(onSetPaid) && status !== "paid";

          return (
            <div className="flex items-center gap-2">
              {status === "paid" ? (
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1 text-white" />
                  <span className="text-white">Paid</span>
                </Badge>
              ) : status === "pending" ? (
                <Badge variant="outline" className="bg-yellow-500 hover:bg-yellow-600 border-yellow-500">
                  <Clock className="h-3 w-3 mr-1 text-white" />
                  <span className="text-white">Pending</span>
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1 text-white" />
                  <span className="text-white">Unpaid</span>
                </Badge>
              )}

              {canPayHere ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  onClick={() => onSetPaid?.(row.original.id)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Pay
                </Button>
              ) : null}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const statusOrder = { paid: 2, pending: 1, unpaid: 0 };
          const a = statusOrder[rowA.original.status as keyof typeof statusOrder] ?? 0;
          const b = statusOrder[rowB.original.status as keyof typeof statusOrder] ?? 0;
          return a - b;  // Sort by status priority
        },
      },
      {
        id: "workflow",
        header: () => <span>Workflow</span>,
        cell: ({ row }) => {
          const stage = deriveWorkflowStage(row.original, workflowGraceDays);
          const tone = getWorkflowTone(stage);
          const className =
            tone === "success"
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : tone === "destructive"
                ? "bg-red-100 text-red-700 border-red-200"
                : tone === "warning"
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200";
          return (
            <Badge variant="outline" className={className}>
              {getWorkflowLabel(stage)}
            </Badge>
          );
        },
      },
      ];

      cols.push({
        id: "actions",
        header: () => <div className="text-right pr-2">Actions</div>,
        cell: ({ row }) => {
          const inv = row.original;
          const copyToClipboard = (text: string, label: string) => {
            navigator.clipboard.writeText(text).then(
              () => notify.success("Copied", `${label} copied to clipboard`),
              () => notify.error("Copy failed", "Could not copy to clipboard")
            );
          };
          return (
            <div className="flex justify-end pr-2">
              <TableRowActions
                actions={[
                  { label: "View details", icon: Eye, onClick: () => onViewInvoice(inv) },
                  { label: "Copy Invoice ID", icon: Copy, onClick: () => copyToClipboard(String(inv.id), "Invoice ID") },
                  { label: "Copy Username", icon: User, onClick: () => copyToClipboard(inv.username, "Username") },
                  ...(inv.email
                    ? [
                        {
                          label: "Send Email",
                          icon: Mail,
                          onClick: () => window.open(`mailto:${inv.email}?subject=Invoice%20%23${inv.id}%20Payment%20Reminder`, "_blank"),
                        },
                      ]
                    : []),
                  ...(onSetPaid
                    ? [
                        {
                          label: "Set as Paid",
                          icon: Check,
                          onClick: () => onSetPaid(inv.id),
                          disabled: inv.status === "paid",
                        },
                      ]
                    : []),
                  ...(onSendReminder
                    ? [
                        {
                          label: "Send Reminder",
                          icon: BellRing,
                          onClick: () => onSendReminder(inv.id),
                        },
                      ]
                    : []),
                  ...(onSetWorkflowStage
                    ? [
                        {
                          label: "Set Stage: Reminded",
                          icon: Clock,
                          onClick: () => onSetWorkflowStage(inv.id, "reminded"),
                        },
                        {
                          label: "Set Stage: Escalated",
                          icon: AlertCircle,
                          onClick: () => onSetWorkflowStage(inv.id, "escalated"),
                        },
                      ]
                    : []),
                  ...(onUnpay
                    ? [
                        {
                          label: "Unpay",
                          icon: XCircle,
                          onClick: () => onUnpay(inv.id),
                          disabled: inv.status !== "paid",
                          tone: "destructive" as const,
                        },
                      ]
                    : []),
                  { label: "Delete", icon: Trash2, onClick: () => onDeleteInvoice(inv.id), tone: "destructive" as const },
                ]}
              />
            </div>
          );
        },
      });

      return cols;
    },
    [onSetPaid, onSendReminder, onSetWorkflowStage, onUnpay, onViewInvoice, onDeleteInvoice, workflowGraceDays]
  );

  /* ── table instance ───────────────────────── */
  const table = useReactTable({
    data: invoices,
    columns,
    state: { sorting, rowSelection },
    // Use stable IDs so selection keys are invoice IDs (not row indexes)
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange,
    enableRowSelection: true,
    onRowSelectionChange,
    manualPagination: true,
  });

  /* ── persist column visibility + density ───── */
  React.useEffect(() => {
    const storedCols = localStorage.getItem('extInv.columns');
    if (storedCols) {
      try {
        const vis = JSON.parse(storedCols) as Record<string, boolean>;
        table.setColumnVisibility(vis);
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    localStorage.setItem('extInv.columns', JSON.stringify(table.getState().columnVisibility));
  }, [table.getState().columnVisibility]);

  return (
    <>
      <div className="min-w-[768px]">
        <TableToolbar
          label={`Invoices: ${totalItems.toLocaleString()} • Page ${currentPage} / ${totalPages}`}
          className="border-b"
          right={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const xlsx = await import("xlsx");
                  const visibleCols = table.getAllLeafColumns().filter((c) => c.getIsVisible());
                  const dataToExport = table.getCoreRowModel().rows.map((r) => {
                    const obj: Record<string, unknown> = {};
                    visibleCols.forEach((col) => {
                      const key = col.id;
                      obj[key] = (r.original as unknown as Record<string, unknown>)[key];
                    });
                    return obj;
                  });
                  const ws = xlsx.utils.json_to_sheet(dataToExport);
                  const wb = xlsx.utils.book_new();
                  xlsx.utils.book_append_sheet(wb, ws, "External Invoices");
                  xlsx.writeFile(wb, "external_invoices_view.xlsx");
                }}
              >
                Export view
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[60vh] overflow-auto">
                  <DropdownMenuLabel>Columns</DropdownMenuLabel>
                  <div className="px-2 py-2 space-y-2">
                    {table.getAllLeafColumns().map((col) => (
                      <label key={col.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={col.getIsVisible()}
                          onCheckedChange={(v) => col.toggleVisibility(!!v)}
                        />
                        <span className="font-mono text-xs text-muted-foreground">{col.id}</span>
                      </label>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />

        <div className="overflow-auto max-h-[70vh]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-white">
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
                    row.getIsSelected() && "bg-primary/50",
                    reconciliationMode && (reconciliationFlags?.get(row.original.id)?.length ?? 0) > 0 && "bg-amber-50/70"
                  )}
                  onDoubleClick={() => onViewInvoice(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-left table-cell">
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
      </div>

      {!hidePager ? (
        <TablePager
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={(p) => {
            if (p <= 1) return onFirstPage();
            if (p >= totalPages) return onLastPage();
            if (p < currentPage) return onPrevPage();
            if (p > currentPage) return onNextPage();
          }}
          onPageSizeChange={onPageSizeChange}
          noun="items"
        />
      ) : null}
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
