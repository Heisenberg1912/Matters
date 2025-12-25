import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/page-layout";
import { contractorDashboardApi, type ContractorDashboardData } from "@/lib/api";
import {
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  Wallet,
  ArrowRight,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContractorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<ContractorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await contractorDashboardApi.getDashboard();
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (err) {
      setError("Failed to load dashboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <PageLayout title="Dashboard">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted mb-4" />
          <p className="text-muted">{error || "No data available"}</p>
          <Button onClick={loadDashboard} variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      </PageLayout>
    );
  }

  const stats = [
    {
      label: "Open Jobs",
      value: data.stats.openJobs,
      icon: Briefcase,
      color: "text-blue-400",
      action: () => navigate("/contractor/jobs"),
    },
    {
      label: "Pending Bids",
      value: data.stats.pendingBids,
      icon: Clock,
      color: "text-yellow-400",
      action: () => navigate("/contractor/bids"),
    },
    {
      label: "Active Jobs",
      value: data.stats.activeJobs,
      icon: TrendingUp,
      color: "text-green-400",
      action: () => navigate("/contractor/assignments"),
    },
    {
      label: "Completed",
      value: data.stats.completedJobs,
      icon: CheckCircle,
      color: "text-[#cfe0ad]",
    },
  ];

  return (
    <PageLayout title="Dashboard">
      <div className="space-y-6">
        {/* Profile Summary */}
        <Card className="p-5 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-[#cfe0ad]/20 flex items-center justify-center text-[#cfe0ad] text-xl font-semibold">
                {data.profile.name?.charAt(0) || "C"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{data.profile.name}</h2>
                  {data.profile.isVerified && (
                    <BadgeCheck className="h-5 w-5 text-[#cfe0ad]" />
                  )}
                </div>
                <p className="text-sm text-muted">
                  {data.profile.company?.name || "Independent Contractor"}
                </p>
                {data.profile.rating && data.profile.rating.count > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">
                      {data.profile.rating.average.toFixed(1)} ({data.profile.rating.count})
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                data.profile.availabilityStatus === "available"
                  ? "bg-green-500/20 text-green-400"
                  : data.profile.availabilityStatus === "busy"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              {data.profile.availabilityStatus === "available"
                ? "Available"
                : data.profile.availabilityStatus === "busy"
                ? "Busy"
                : "On Leave"}
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="p-4 cursor-pointer hover:bg-[#1a1a1a] transition"
              onClick={stat.action}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-[#1a1a1a]", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Earnings Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Earnings</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/contractor/earnings")}
              className="text-[#cfe0ad]"
            >
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Wallet className="h-4 w-4" />
                <span className="text-xs">This Month</span>
              </div>
              <p className="text-xl font-bold text-[#cfe0ad]">
                {formatCurrency(data.stats.monthlyEarnings)}
              </p>
            </div>
            <div className="p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-2 text-muted mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Total Earnings</span>
              </div>
              <p className="text-xl font-bold">
                {formatCurrency(data.stats.totalEarnings)}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/contractor/jobs")}
          >
            <Briefcase className="h-5 w-5" />
            <span className="text-sm">Find Jobs</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/contractor/progress")}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Submit Update</span>
          </Button>
        </div>

        {/* Recent Projects */}
        {data.recentProjects.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Active Projects</h3>
            <div className="space-y-3">
              {data.recentProjects.map((project) => (
                <div
                  key={project._id}
                  className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl"
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-xs text-muted capitalize">{project.status.replace("_", " ")}</p>
                  </div>
                  {project.progress && (
                    <div className="text-right">
                      <p className="text-sm font-medium">{project.progress.percentage}%</p>
                      <p className="text-xs text-muted">Progress</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Updates */}
        {data.recentUpdates.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Recent Updates</h3>
            <div className="space-y-3">
              {data.recentUpdates.map((update) => (
                <div
                  key={update._id}
                  className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#cfe0ad]/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[#cfe0ad]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{update.title || update.type}</p>
                    <p className="text-xs text-muted">{update.project.name}</p>
                  </div>
                  <p className="text-xs text-muted">
                    {new Date(update.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
