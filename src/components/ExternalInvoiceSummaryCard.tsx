import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, CheckCircle, XCircle } from "lucide-react";
import type { InvoiceMetrics } from "@/hooks/useExternalInvoices";

type Props = { metrics: InvoiceMetrics };

const ExternalInvoiceSummaryCard: React.FC<Props> = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    {/* paid */}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
        <CheckCircle className="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metrics.totalPaid}</div>
        <p className="text-xs text-muted-foreground">
          {((metrics.totalPaid / metrics.totalInvoices) * 100).toFixed(1)}% of total
        </p>
      </CardContent>
    </Card>

    {/* unpaid */}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
        <XCircle className="h-4 w-4 text-red-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metrics.totalUnpaid}</div>
        <p className="text-xs text-muted-foreground">
          {((metrics.totalUnpaid / metrics.totalInvoices) * 100).toFixed(1)}% of total
        </p>
      </CardContent>
    </Card>

    {/* total invoices */}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
        <FileText className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
        <p className="text-xs text-muted-foreground">All invoices</p>
      </CardContent>
    </Card>

    {/* total amount */}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
        <DollarSign className="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${metrics.totalAmount.toFixed(2)}</div>
        <p className="text-xs text-muted-foreground">Total amount of all invoices</p>
      </CardContent>
    </Card>
  </div>
);

export default ExternalInvoiceSummaryCard;
