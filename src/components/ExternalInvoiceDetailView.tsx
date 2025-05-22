import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ExternalInvoice } from "@/types/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<ExternalInvoice>({
    ...invoice,
  });

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

  /* ── render ───────────────────────────────── */
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>External Invoice Details</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-6 py-4">
          <div>
            {Object.entries(editedInvoice).slice(0, Math.ceil(Object.keys(editedInvoice).length / 2)).map(([key, value]) => renderField(key, value))}
          </div>
          <div>
            {Object.entries(editedInvoice).slice(Math.ceil(Object.keys(editedInvoice).length / 2)).map(([key, value]) => renderField(key, value))}
          </div>
        </div>

        <DialogFooter>
          {isEditing ? (
            <>
              <Button onClick={saveAndClose}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExternalInvoiceDetailView;
