import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCircle, Eye, XCircle, DollarSign, AlertCircle } from "lucide-react";
import { ExternalInvoice } from "@/types/api";


type Props = {
  invoice: ExternalInvoice;
  onSetPaid?: () => void;
  onViewDetails?: () => void;
};

const ExternalInvoiceCard: React.FC<Props> = ({ invoice, onSetPaid, onViewDetails }) => {
  const isPaid = invoice.status === "paid";
  const billingMonthStart = new Date(invoice.billingMonth + "T00:00:00");
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const isOverdue = !isPaid && billingMonthStart < currentMonthStart;

  return (
    <Card
      className={`mb-4 transition-colors ${onViewDetails ? "cursor-pointer hover:bg-accent/30" : ""}`}
      onClick={onViewDetails ? () => onViewDetails() : undefined}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-blue-600">
            Invoice #{invoice.id}
          </span>
          <div className="flex items-center gap-2">
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
            <span
              className={`flex items-center text-sm ${
                isPaid ? "text-green-600" : "text-amber-600"
              }`}
            >
              {isPaid ? (
                <CheckCircle className="h-4 w-4 mr-1" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              {invoice.status}
            </span>
          </div>
        </CardTitle>
        <CardDescription>{invoice.username}</CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div>
            <span className="font-semibold">Full Name:</span>{" "}
            {invoice.fullName}
          </div>
          <div>
            <span className="font-semibold">Billing:</span>{" "}
            {new Date(invoice.billingMonth).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
        <div className="text-lg font-bold flex items-center">
          <DollarSign className="h-4 w-4 mr-1" />
          {invoice.amount.toFixed(2)}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-2">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View details
          </Button>
        )}
        {onSetPaid && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSetPaid();
            }}
            disabled={isPaid}
            className={
              isPaid ? "" : "text-green-600 hover:text-green-700 hover:bg-green-50"
            }
          >
            <Check className="h-4 w-4 mr-1" />
            Set as Paid
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ExternalInvoiceCard;
