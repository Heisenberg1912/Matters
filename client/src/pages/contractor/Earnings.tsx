import { useEffect, useState } from "react";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contractorDashboardApi, type ContractorEarnings } from "@/lib/api";
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Loader2,
  Wallet,
} from "lucide-react";

export default function Earnings() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<ContractorEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEarnings();
  }, [year]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contractorDashboardApi.getEarnings(year);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || "Failed to load earnings");
      }
    } catch (err) {
      setError("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatMonth = (month: string) => {
    const date = new Date(`${month}-01T00:00:00`);
    if (Number.isNaN(date.getTime())) return month;
    return date.toLocaleString("en-IN", { month: "short" });
  };

  if (loading) {
    return (
      <PageLayout title="Earnings">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout title="Earnings">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted mb-4" />
          <p className="text-sm text-muted mb-4">{error || "No earnings data"}</p>
          <Button onClick={loadEarnings}>Retry</Button>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Earnings">
      <div className="space-y-6">
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Yearly Summary</h3>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted" />
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || currentYear)}
                className="h-9 w-24"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Wallet className="h-4 w-4" />
                <span className="text-xs">Year Total</span>
              </div>
              <p className="text-xl font-bold text-[#cfe0ad]">
                {formatCurrency(data.totalEarnings)}
              </p>
            </div>
            <div className="p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-2 text-muted mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">All Time</span>
              </div>
              <p className="text-xl font-bold">
                {formatCurrency(data.allTimeEarnings)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Monthly Breakdown</h3>
          <div className="grid grid-cols-3 gap-3">
            {data.monthlyBreakdown.map((item) => (
              <div key={item.month} className="p-3 bg-[#1a1a1a] rounded-xl">
                <p className="text-xs text-muted">{formatMonth(item.month)}</p>
                <p className="text-sm font-semibold mt-1">
                  {formatCurrency(item.amount)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Recent Payments</h3>
          {data.recentPayments.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted">
              No recent payments yet.
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentPayments.map((payment) => (
                <div
                  key={payment.jobId}
                  className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl"
                >
                  <div>
                    <p className="font-medium">{payment.jobTitle}</p>
                    <p className="text-xs text-muted">{payment.project?.name}</p>
                    <p className="text-xs text-muted">
                      {new Date(payment.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#cfe0ad]">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-muted">{payment.customer?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
