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
import { Check, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { ExternalInvoice } from "@/types/api";


type Props = {
  invoice: ExternalInvoice;
  onSetPaid: () => void;
};

const ExternalInvoiceCard: React.FC<Props> = ({ invoice, onSetPaid }) => {
  const isPaid = invoice.status === "paid";

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="font-semibold text-blue-600">
            Invoice #{invoice.id}
          </span>
          <span
            className={`flex items-center ${
              isPaid ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPaid ? (
              <CheckCircle className="h-4 w-4 mr-1" />
            ) : (
              <XCircle className="h-4 w-4 mr-1" />
            )}
            {invoice.status}
          </span>
        </CardTitle>
        <CardDescription>{invoice.username}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div>
            <span className="font-semibold">Full Name:</span>{" "}
            {invoice.fullName}
          </div>
          <div>
            <span className="font-semibold">Billing Month:</span>{" "}
            {new Date(invoice.billingMonth).toLocaleDateString()}
          </div>
        </div>
        <div className="text-lg font-bold flex items-center">
          <DollarSign className="h-4 w-4 mr-1" />
          {invoice.amount.toFixed(2)}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onSetPaid}
          disabled={isPaid}
          className={
            isPaid ? "" : "text-green-600 hover:text-green-700 hover:bg-green-50"
          }
        >
          <Check className="h-4 w-4 mr-1" />
          Set as Paid
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExternalInvoiceCard;
