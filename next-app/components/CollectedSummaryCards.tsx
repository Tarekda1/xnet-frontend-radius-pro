import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Receipt } from 'lucide-react';
import { useCollectedMetrics } from '@/hooks/useInvoices';
import { useRouter } from "next/navigation";

const CollectedSummaryCards: React.FC = () => {
  const { data, isLoading } = useCollectedMetrics();
  const router = useRouter();

  const totalInvoices = data?.totalCollectedInvoices ?? 0;
  const totalCash = data?.totalCashCollected ?? 0;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/collections?view=breakdown')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invoices Collected</CardTitle>
          <Receipt className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{isLoading ? '...' : totalInvoices.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Click to view per-collector breakdown</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/collections?view=list')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cash Collected</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{isLoading ? '...' : totalCash.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Click to view collected invoices list</p>
        </CardContent>
      </Card>
    </>
  );
};

export default CollectedSummaryCards;


