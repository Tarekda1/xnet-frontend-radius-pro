import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";

export type ActionConfirmTone = "default" | "destructive";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  description?: string;
  children?: React.ReactNode;

  confirmText?: string;
  cancelText?: string;
  confirmTone?: ActionConfirmTone;

  /** If provided, dialog disables actions while true */
  isConfirming?: boolean;
  /** Called when user confirms. Can be async. */
  onConfirm: () => void | Promise<void>;
};

export default function ActionConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmTone = "default",
  isConfirming,
  onConfirm,
}: Props) {
  const [internalPending, setInternalPending] = React.useState(false);
  const pending = Boolean(isConfirming ?? internalPending);

  async function handleConfirm() {
    try {
      setInternalPending(true);
      try {
        await onConfirm();
        onOpenChange(false);
      } catch (err: any) {
        // Keep dialog open; mutation handlers usually toast already, but avoid silent failures.
        notify.error("Action failed", err?.message ? String(err.message) : undefined);
      }
    } finally {
      setInternalPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={pending ? () => {} : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>

        {children ? <div className="pt-1">{children}</div> : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
            className={cn(confirmTone === "destructive" && "bg-red-600 hover:bg-red-700")}
          >
            {pending ? "Working..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

