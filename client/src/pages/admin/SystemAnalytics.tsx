import { useEffect, useMemo, useState } from "react";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminDashboardApi } from "@/lib/api";
import { AlertCircle, BarChart3, Loader2, TrendingUp } from "lucide-react";

type AnalyticsData = {
  userGrowth: Array<{ _id: string; count: number }>;
  projectsByStatus: Record<string, number>;
  projectsByType: Record<string, number>;
  jobsByStatus: Record<string, number>;
  revenueByMonth: Array<{ _id: string; totalBilled: number; totalPaid: number; count: number }>;
  usersByRole: Record<string, number>;
  topCities: Array<{ _id: string; count: number }>;
};

const PERIOD_OPTIONS = [
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
];

export default function SystemAnalytics() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminDashboardApi.getAnalytics(period);
      if (response.success && response.data) {
        setData(response.data as AnalyticsData);
      } else {
        setError(response.error || "Failed to load analytics");
      }
    } catch (err) {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    if (!data) return null;
    const totalUsers = Object.values(data.usersByRole || {}).reduce((sum, value) => sum + value, 0);
    const totalProjects = Object.values(data.projectsByStatus || {}).reduce((sum, value) => sum + value, 0);
    const totalJobs = Object.values(data.jobsByStatus || {}).reduce((sum, value) => sum + value, 0);
    return { totalUsers, totalProjects, totalJobs };
  }, [data]);

  if (loading) {
    return (
      <PageLayout title="System Analytics">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  if (error || !data || !totals) {
    return (
      <PageLayout title="System Analytics">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted mb-4" />
          <p className="text-sm text-muted mb-4">{error || "No analytics data"}</p>
          <Button onClick={loadAnalytics}>Retry</Button>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="System Analytics">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted">
            <TrendingUp className="h-4 w-4" />
            <span>Period</span>
          </div>
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-3 py-1.5 rounded-full text-xs transition ${
                  period === option.value
                    ? "bg-[#cfe0ad] text-black"
                    : "bg-[#1a1a1a] hover:bg-[#2a2a2a]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 bg-[#1a1a1a]">
            <p className="text-xs text-muted">Total Users</p>
            <p className="text-xl font-semibold text-[#cfe0ad]">{totals.totalUsers}</p>
          </Card>
          <Card className="p-4 bg-[#1a1a1a]">
            <p className="text-xs text-muted">Total Projects</p>
            <p className="text-xl font-semibold">{totals.totalProjects}</p>
          </Card>
          <Card className="p-4 bg-[#1a1a1a]">
            <p className="text-xs text-muted">Total Jobs</p>
            <p className="text-xl font-semibold">{totals.totalJobs}</p>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">User Growth</h3>
          {(data.userGrowth || []).length === 0 ? (
            <p className="text-sm text-muted">No new users in this period.</p>
          ) : (
            <div className="space-y-2">
              {(data.userGrowth || []).slice(-7).map((entry) => (
                <div key={entry._id} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{entry._id}</span>
                  <span className="font-medium">{entry.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Projects by Status</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.projectsByStatus || {}).map(([status, count]) => (
              <div key={status} className="p-3 bg-[#1a1a1a] rounded-xl">
                <p className="text-xs text-muted capitalize">{status.replace("_", " ")}</p>
                <p className="text-sm font-semibold mt-1">{count}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Jobs by Status</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.jobsByStatus || {}).map(([status, count]) => (
              <div key={status} className="p-3 bg-[#1a1a1a] rounded-xl">
                <p className="text-xs text-muted capitalize">{status.replace("_", " ")}</p>
                <p className="text-sm font-semibold mt-1">{count}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Revenue by Month</h3>
          {(data.revenueByMonth || []).length === 0 ? (
            <p className="text-sm text-muted">No revenue recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {(data.revenueByMonth || []).map((entry) => (
                <div key={entry._id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted">
                    <BarChart3 className="h-4 w-4" />
                    <span>{entry._id}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">INR {entry.totalBilled.toLocaleString()}</p>
                    <p className="text-xs text-muted">Paid: INR {entry.totalPaid.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Users by Role</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.usersByRole || {}).map(([role, count]) => (
              <div key={role} className="p-3 bg-[#1a1a1a] rounded-xl">
                <p className="text-xs text-muted capitalize">{role}</p>
                <p className="text-sm font-semibold mt-1">{count}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Top Cities</h3>
          {(data.topCities || []).length === 0 ? (
            <p className="text-sm text-muted">No location data available.</p>
          ) : (
            <div className="space-y-2">
              {(data.topCities || []).map((city) => (
                <div key={city._id} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{city._id}</span>
                  <span className="font-medium">{city.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
