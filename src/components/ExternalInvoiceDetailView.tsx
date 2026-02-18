import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon, Copy, User } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ExternalInvoice } from "@/types/api";
import { useExternalInvoices } from "@/hooks/useExternalInvoices";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { notify } from "@/lib/notify";

type Props = {
  invoice: ExternalInvoice;
  onClose: () => void;
  onSave: (updated: ExternalInvoice) => void;
};

const ExternalInvoiceDetailView: React.FC<Props> = ({
  invoice,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const canPay = can(user, "billing.externalInvoices.pay");
  const canUnpay = can(user, "billing.externalInvoices.unpay");
  const canSendReminder = isFeatureEnabled("whatsapp-remind");

  const [isEditing, setIsEditing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pos" | "transfer" | "other" | "gateway">("cash");
  const [editedInvoice, setEditedInvoice] = useState<ExternalInvoice>({
    ...invoice,
  });

  const historyItems = useMemo(() => {
    const items: Array<{ label: string; date: string | null }> = [];
    items.push({ label: "Created", date: (invoice as any).createdAt || null });
    if ((invoice as any).paidAt) items.push({ label: "Paid", date: (invoice as any).paidAt });
    return items;
  }, [invoice]);

  // lightweight access to mutations via hook (pageSize 1 to avoid heavy work)
  const { updateInvoiceMutation, setInvoiceAsPaidMutation, unpayInvoiceMutation, sendReminderMutation, refetch } = useExternalInvoices({ initialPage: 1, pageSize: 1, search: "", });
  const { toast } = useToast();

  /* ── handlers ─────────────────────────────── */
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditedInvoice((prev) => ({ ...prev, [id]: value }));
  };

  const handleDate = (date: Date | undefined, field: keyof ExternalInvoice) => {
    if (date)
      setEditedInvoice((prev) => ({ ...prev, [field]: date.toISOString() }));
  };

  const handleStatusChange = (value: string) => {
    setEditedInvoice((prev: any) => ({ ...prev, status: value }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => notify.success("Copied", `${label} copied to clipboard`),
      () => notify.error("Copy failed", "Could not copy to clipboard")
    );
  };

  const renderField = (key: string, value: any) => (
    <div key={key} className="mb-4">
      <Label htmlFor={key} className="block mb-2 capitalize">
        {key}
      </Label>
      {key === "status" && isEditing ? (
        <Select
          value={value as string}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      ) : key === "paidAt" && isEditing ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(d) => handleDate(d!, "paidAt")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      ) : (
        <Input
          id={key}
          value={
            ["billingMonth", "createdAt", "paidAt"].includes(key)
              ? value
                ? new Date(value as string).toLocaleString()
                : ""
              : (value as string)
          }
          readOnly={!isEditing || key === "id" || key === "createdAt"}
          onChange={handleInput}
          className="w-full"
        />
      )}
    </div>
  );

  const saveAndClose = () => {
    onSave(editedInvoice);
    setIsEditing(false);
  };

  const markPaidLocal = () => {
    if (!canPay) return;
    const prev = { status: editedInvoice.status, paidAt: (editedInvoice as any).paidAt } as any;
    setEditedInvoice((prevInv: any) => ({ ...prevInv, status: "paid", paidAt: new Date().toISOString() }));
    setInvoiceAsPaidMutation.mutate({ invoiceId: editedInvoice.id, paymentMethod, silent: true }, {
      onSuccess: () => {
        refetch();
        toast({
          title: `Invoice #${editedInvoice.id} marked as paid`,
          action: (
            <ToastAction altText="Undo" onClick={() => updateInvoiceMutation.mutate({ invoiceId: editedInvoice.id, invoiceData: prev }, { onSuccess: () => refetch() })}>
              Undo
            </ToastAction>
          ),
        });
      },
      onError: () => setEditedInvoice((_) => ({ ..._, ...prev })),
    });
  };

  const markUnpaidLocal = () => {
    if (!canUnpay) return;
    const prev = { status: editedInvoice.status, paidAt: (editedInvoice as any).paidAt } as any;
    setEditedInvoice((prevInv: any) => ({ ...prevInv, status: "unpaid", paidAt: null }));
    unpayInvoiceMutation.mutate({ invoiceId: editedInvoice.id, silent: true }, {
      onSuccess: () => {
        refetch();
        toast({
          title: `Invoice #${editedInvoice.id} marked as unpaid`,
          action: (
            <ToastAction altText="Undo" onClick={() => updateInvoiceMutation.mutate({ invoiceId: editedInvoice.id, invoiceData: prev }, { onSuccess: () => refetch() })}>
              Undo
            </ToastAction>
          ),
        });
      },
      onError: () => setEditedInvoice((_) => ({ ..._, ...prev })),
    });
  };

  /* ── render ───────────────────────────────── */
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="lg:max-w-4xl w-full p-0 overflow-hidden relative flex flex-col max-h-[85vh]">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b bg-background/90 backdrop-blur">
          <DialogHeader>
            <DialogTitle>External Invoice Details</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(String(editedInvoice.id), "Invoice ID")}
              title="Copy Invoice ID"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy ID
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(editedInvoice.username, "Username")}
              title="Copy Username"
            >
              <User className="h-4 w-4 mr-1" />
              Copy User
            </Button>
            {editedInvoice.status !== "paid" ? (
              canPay ? (
                <Button variant="outline" size="sm" onClick={markPaidLocal}>
                  Mark Paid
                </Button>
              ) : null
            ) : (
              canUnpay ? (
                <Button variant="outline" size="sm" onClick={markUnpaidLocal}>
                  Mark Unpaid
                </Button>
              ) : null
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => sendReminderMutation.mutate(editedInvoice.id)}
              disabled={!canSendReminder}
              title={!canSendReminder ? "Reminder feature is disabled" : "Send WhatsApp reminder"}
            >
              Send Reminder
            </Button>
            {isEditing ? (
              <>
                <Button size="sm" onClick={saveAndClose}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>Edit</Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>

        {/* Body with tabs - scrolls within the dialog */}
        <div className="p-4 flex-1 overflow-y-auto overflow-x-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {Object.entries(editedInvoice)
                    .slice(0, Math.ceil(Object.keys(editedInvoice).length / 2))
                    .map(([key, value]) => renderField(key, value))}
                </div>
                <div>
                  {Object.entries(editedInvoice)
                    .slice(Math.ceil(Object.keys(editedInvoice).length / 2))
                    .map(([key, value]) => renderField(key, value))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField("status", (editedInvoice as any).status)}
                {renderField("paidAt", (editedInvoice as any).paidAt)}
              </div>
              <div className="max-w-xs">
                <Label className="block mb-2">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="gateway">Gateway</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                {editedInvoice.status !== "paid" ? (
                  <Button onClick={markPaidLocal}>Mark Paid</Button>
                ) : (
                  <Button variant="outline" onClick={markUnpaidLocal}>Mark Unpaid</Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-3">
              {historyItems.length === 0 && (
                <div className="text-sm text-muted-foreground">No history available.</div>
              )}
              <div className="space-y-3">
                {historyItems.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="text-sm">
                      <span className="font-medium mr-2">{h.label}</span>
                      <span className="text-muted-foreground">{h.date ? new Date(h.date).toLocaleString() : "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExternalInvoiceDetailView;
