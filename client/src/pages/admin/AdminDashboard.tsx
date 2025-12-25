import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/page-layout";
import { adminDashboardApi } from "@/lib/api";
import {
  Users,
  Building2,
  Briefcase,
  Ticket,
  HardHat,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  DollarSign,
  UserPlus,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  overview: {
    users: { total: number; newThisMonth: number };
    projects: { total: number; active: number };
    jobs: { total: number; open: number };
    tickets: { pending: number };
    contractors: { total: number; verified: number };
  };
  revenue: { totalBilled: number; totalPaid: number; count: number };
  recentActivity: {
    users: Array<{ _id: string; name: string; email: string; role: string; createdAt: string }>;
    projects: Array<{ _id: string; name: string; status: string; owner: { name: string }; createdAt: string }>;
    tickets: Array<{ _id: string; ticketNumber: string; subject: string; status: string; priority: string; user: { name: string }; createdAt: string }>;
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminDashboardApi.getDashboard();
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <PageLayout title="Admin Dashboard">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card animate-pulse rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout title="Admin Dashboard">
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

  const overviewCards = [
    {
      label: "Total Users",
      value: data.overview.users.total,
      subValue: `+${data.overview.users.newThisMonth} this month`,
      icon: Users,
      color: "text-blue-400",
      action: () => navigate("/admin/users"),
    },
    {
      label: "Projects",
      value: data.overview.projects.total,
      subValue: `${data.overview.projects.active} active`,
      icon: Building2,
      color: "text-green-400",
      action: () => navigate("/admin/projects"),
    },
    {
      label: "Contractors",
      value: data.overview.contractors.total,
      subValue: `${data.overview.contractors.verified} verified`,
      icon: HardHat,
      color: "text-orange-400",
      action: () => navigate("/admin/contractors"),
    },
    {
      label: "Open Tickets",
      value: data.overview.tickets.pending,
      subValue: "Pending review",
      icon: Ticket,
      color: "text-red-400",
      action: () => navigate("/admin/tickets"),
    },
  ];

  return (
    <PageLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-3">
          {overviewCards.map((card) => (
            <Card
              key={card.label}
              className="p-4 cursor-pointer hover:bg-[#1a1a1a] transition"
              onClick={card.action}
            >
              <div className="flex items-start justify-between">
                <div className={cn("p-2 rounded-lg bg-[#1a1a1a]", card.color)}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-3">{card.value}</p>
              <p className="text-xs text-muted">{card.label}</p>
              <p className="text-xs text-[#cfe0ad] mt-1">{card.subValue}</p>
            </Card>
          ))}
        </div>

        {/* Revenue Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Revenue Overview</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/analytics")}
              className="text-[#cfe0ad]"
            >
              Analytics <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-2 text-muted mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Billed</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(data.revenue.totalBilled)}</p>
            </div>
            <div className="p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-2 text-muted mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">Paid</span>
              </div>
              <p className="text-lg font-bold text-green-400">
                {formatCurrency(data.revenue.totalPaid)}
              </p>
            </div>
            <div className="p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-2 text-muted mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Bills</span>
              </div>
              <p className="text-lg font-bold">{data.revenue.count}</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/admin/contractors")}
          >
            <HardHat className="h-5 w-5" />
            <span className="text-sm">Verify Contractors</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/admin/tickets")}
          >
            <Ticket className="h-5 w-5" />
            <span className="text-sm">Support Tickets</span>
          </Button>
        </div>

        {/* Recent Users */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Users</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/users")}
              className="text-[#cfe0ad]"
            >
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {data.recentActivity.users.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#cfe0ad]/20 flex items-center justify-center text-[#cfe0ad]">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs",
                      user.role === "contractor"
                        ? "bg-orange-500/20 text-orange-400"
                        : user.role === "admin"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-blue-500/20 text-blue-400"
                    )}
                  >
                    {user.role}
                  </span>
                  <p className="text-xs text-muted mt-1">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Tickets */}
        {data.recentActivity.tickets.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Tickets</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/tickets")}
                className="text-[#cfe0ad]"
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {data.recentActivity.tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl cursor-pointer hover:bg-[#222]"
                  onClick={() => navigate(`/admin/tickets/${ticket._id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">{ticket.ticketNumber}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs",
                          ticket.priority === "high"
                            ? "bg-red-500/20 text-red-400"
                            : ticket.priority === "medium"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                        )}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="font-medium truncate mt-1">{ticket.subject}</p>
                    <p className="text-xs text-muted">{ticket.user.name}</p>
                  </div>
                  <div
                    className={cn(
                      "px-2 py-1 rounded text-xs",
                      ticket.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : ticket.status === "in_progress"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-green-500/20 text-green-400"
                    )}
                  >
                    {ticket.status.replace("_", " ")}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
