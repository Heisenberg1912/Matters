import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { jobsApi, type Bid, type Job } from "@/lib/api";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Loader2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type BidEntry = {
  job: Job;
  bid: Bid;
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

export default function MyBids() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<BidEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    proposal: "",
    estimatedDuration: "",
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadBids(1, true);
  }, [statusFilter]);

  const loadBids = async (nextPage = 1, replace = false) => {
    try {
      if (nextPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const response = await jobsApi.getMyBids({
        page: nextPage,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      if (response.success && response.data) {
        const nextEntries = response.data.bids.filter((item) => item.bid) as BidEntry[];
        setEntries((prev) => (replace ? nextEntries : [...prev, ...nextEntries]));
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
        setPage(nextPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getBidStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs">Pending</span>;
      case "accepted":
        return <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">Accepted</span>;
      case "rejected":
        return <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 text-xs">{status}</span>;
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">Open</span>;
      case "assigned":
        return <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">Assigned</span>;
      case "in_progress":
        return <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs">In Progress</span>;
      case "completed":
        return <span className="px-2 py-0.5 rounded bg-[#cfe0ad]/20 text-[#cfe0ad] text-xs">Completed</span>;
      case "cancelled":
        return <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 text-xs">{status}</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const startEdit = (bid: Bid) => {
    setEditingBidId(bid._id);
    setEditForm({
      amount: String(bid.amount || ""),
      proposal: bid.proposal || "",
      estimatedDuration: bid.estimatedDuration || "",
    });
  };

  const cancelEdit = () => {
    setEditingBidId(null);
    setEditForm({ amount: "", proposal: "", estimatedDuration: "" });
  };

  const handleUpdateBid = async (jobId: string, bidId: string) => {
    if (!editForm.amount || !editForm.proposal.trim()) {
      toast.error("Amount and proposal are required");
      return;
    }

    try {
      setActionLoading(bidId);
      const response = await jobsApi.updateBid(jobId, bidId, {
        amount: Number(editForm.amount),
        proposal: editForm.proposal.trim(),
        estimatedDuration: editForm.estimatedDuration.trim() || undefined,
      });

      if (response.success) {
        toast.success("Bid updated");
        cancelEdit();
        loadBids(1, true);
      } else {
        toast.error(response.error || "Failed to update bid");
      }
    } catch (err) {
      toast.error("Failed to update bid");
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async (jobId: string, bidId: string) => {
    try {
      setActionLoading(bidId);
      const response = await jobsApi.withdrawBid(jobId, bidId);
      if (response.success) {
        toast.success("Bid withdrawn");
        loadBids(1, true);
      } else {
        toast.error(response.error || "Failed to withdraw bid");
      }
    } catch (err) {
      toast.error("Failed to withdraw bid");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <PageLayout title="My Bids">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="My Bids">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs transition",
                statusFilter === option.value
                  ? "bg-[#cfe0ad] text-black"
                  : "bg-[#1a1a1a] hover:bg-[#2a2a2a]"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {entries.length === 0 ? (
          <Card className="p-8 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted mb-4" />
            <h3 className="font-semibold mb-2">No Bids Yet</h3>
            <p className="text-sm text-muted mb-4">
              Browse open jobs and submit your first bid.
            </p>
            <Button onClick={() => navigate("/contractor/jobs")}>Find Jobs</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {entries.map(({ job, bid }) => (
              <Card key={bid._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{job.title}</h3>
                      {getJobStatusBadge(job.status)}
                      {getBidStatusBadge(bid.status)}
                    </div>
                    <p className="text-sm text-muted truncate">{job.project?.name}</p>
                  </div>
                  <button
                    className="text-muted hover:text-[#cfe0ad] transition"
                    onClick={() => navigate(`/contractor/jobs/${job._id}`)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted">Bid Amount</p>
                    <p className="text-lg font-semibold text-[#cfe0ad]">
                      {formatCurrency(bid.amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">Submitted</p>
                    <p className="text-sm">
                      {new Date(bid.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {editingBidId === bid._id ? (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs text-muted">Amount (INR)</label>
                      <Input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted">Estimated Duration</label>
                      <Input
                        value={editForm.estimatedDuration}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, estimatedDuration: e.target.value }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted">Proposal</label>
                      <Textarea
                        value={editForm.proposal}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, proposal: e.target.value }))
                        }
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleUpdateBid(job._id, bid._id)}
                        disabled={actionLoading === bid._id}
                      >
                        {actionLoading === bid._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted mt-3 line-clamp-3">{bid.proposal}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {bid.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(bid)}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Edit Bid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWithdraw(job._id, bid._id)}
                            disabled={actionLoading === bid._id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Withdraw
                          </Button>
                        </>
                      )}
                      {bid.status === "accepted" && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          Bid Accepted
                        </div>
                      )}
                      {bid.status === "rejected" && (
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <XCircle className="h-4 w-4" />
                          Bid Rejected
                        </div>
                      )}
                      {bid.status === "pending" && job.status !== "open" && (
                        <div className="flex items-center gap-2 text-yellow-400 text-sm">
                          <Clock className="h-4 w-4" />
                          Job no longer open
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card>
            ))}

            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => loadBids(page + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
