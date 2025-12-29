import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { jobsApi, type Bid, type Job } from "@/lib/api";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  DollarSign,
  Loader2,
  MapPin,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function JobDetails() {
  const navigate = useNavigate();
  const { jobId: id } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [bidForm, setBidForm] = useState({
    amount: "",
    proposal: "",
    estimatedDuration: "",
  });

  useEffect(() => {
    if (id) {
      loadJob(id);
    }
  }, [id]);

  const loadJob = async (jobId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobsApi.getById(jobId);
      if (response.success && response.data) {
        const data = response.data as Job;
        setJob(data);
        const existingBid = data.bids?.[0] as Bid | undefined;
        if (existingBid) {
          setBidForm({
            amount: String(existingBid.amount || ""),
            proposal: existingBid.proposal || "",
            estimatedDuration: existingBid.estimatedDuration || "",
          });
        }
      } else {
        setError(response.error || "Failed to load job");
      }
    } catch (err) {
      setError("Failed to load job");
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (budget?: Job["budget"]) => {
    if (!budget) return "Negotiable";
    const { min, max, currency = "INR" } = budget;
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    if (min) return `${currency} ${min.toLocaleString()}+`;
    if (max) return `Up to ${currency} ${max.toLocaleString()}`;
    return "Negotiable";
  };

  const getStatusBadge = (status: string) => {
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

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!job) return;
    if (!bidForm.amount || !bidForm.proposal.trim()) {
      toast.error("Amount and proposal are required");
      return;
    }

    try {
      setSaving(true);
      const existingBid = job.bids?.[0] as Bid | undefined;
      let response;
      if (existingBid) {
        response = await jobsApi.updateBid(job._id, existingBid._id, {
          amount: Number(bidForm.amount),
          proposal: bidForm.proposal.trim(),
          estimatedDuration: bidForm.estimatedDuration.trim() || undefined,
        });
      } else {
        response = await jobsApi.submitBid(job._id, {
          amount: Number(bidForm.amount),
          proposal: bidForm.proposal.trim(),
          estimatedDuration: bidForm.estimatedDuration.trim() || undefined,
        });
      }

      if (response.success) {
        toast.success(existingBid ? "Bid updated" : "Bid submitted");
        loadJob(job._id);
      } else {
        toast.error(response.error || "Failed to submit bid");
      }
    } catch (err) {
      toast.error("Failed to submit bid");
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawBid = async () => {
    if (!job) return;
    const existingBid = job.bids?.[0] as Bid | undefined;
    if (!existingBid) return;

    try {
      setWithdrawing(true);
      const response = await jobsApi.withdrawBid(job._id, existingBid._id);
      if (response.success) {
        toast.success("Bid withdrawn");
        loadJob(job._id);
        setBidForm({ amount: "", proposal: "", estimatedDuration: "" });
      } else {
        toast.error(response.error || "Failed to withdraw bid");
      }
    } catch (err) {
      toast.error("Failed to withdraw bid");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Job Details" showBackButton showBreadcrumbs>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-card animate-pulse rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  if (error || !job) {
    return (
      <PageLayout title="Job Details" showBackButton showBreadcrumbs>
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted mb-4" />
          <p className="text-sm text-muted mb-4">{error || "Job not found"}</p>
          <Button onClick={() => navigate("/contractor/jobs")}>Back to Jobs</Button>
        </Card>
      </PageLayout>
    );
  }

  const existingBid = job.bids?.[0] as Bid | undefined;
  const canBid = job.status === "open";
  const canEdit = existingBid?.status === "pending" && canBid;

  return (
    <PageLayout title="Job Details" showBackButton showBreadcrumbs breadcrumbLabel={job.title}>
      <div className="space-y-6">
        <Card className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{job.title}</h2>
              <p className="text-sm text-muted">{job.project?.name}</p>
            </div>
            {getStatusBadge(job.status)}
          </div>

          {job.description && (
            <p className="text-sm text-muted">{job.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-muted">
            {job.location?.city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{job.location.city}</span>
              </div>
            )}
            {job.timeline?.startDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(job.timeline.startDate).toLocaleDateString()}</span>
              </div>
            )}
            {job.workType && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                <span className="capitalize">{job.workType.replace("_", " ")}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[#cfe0ad]">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">{formatBudget(job.budget)}</span>
          </div>

          {job.requiredSpecializations?.length ? (
            <div className="flex flex-wrap gap-2">
              {job.requiredSpecializations.map((spec) => (
                <span key={spec} className="px-2 py-0.5 bg-[#1a1a1a] rounded text-xs">
                  {spec}
                </span>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Your Bid</h3>
            {existingBid && getBidStatusBadge(existingBid.status)}
          </div>

          {!canBid && !existingBid && (
            <div className="text-sm text-muted">
              This job is no longer accepting bids.
            </div>
          )}

          <form onSubmit={handleSubmitBid} className="space-y-4">
            <div>
              <label className="text-sm text-muted">Amount (INR)</label>
              <Input
                type="number"
                value={bidForm.amount}
                onChange={(e) => setBidForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="mt-1"
                disabled={existingBid ? !canEdit : !canBid}
              />
            </div>
            <div>
              <label className="text-sm text-muted">Estimated Duration</label>
              <Input
                value={bidForm.estimatedDuration}
                onChange={(e) =>
                  setBidForm((prev) => ({ ...prev, estimatedDuration: e.target.value }))
                }
                className="mt-1"
                disabled={existingBid ? !canEdit : !canBid}
              />
            </div>
            <div>
              <label className="text-sm text-muted">Proposal</label>
              <Textarea
                value={bidForm.proposal}
                onChange={(e) => setBidForm((prev) => ({ ...prev, proposal: e.target.value }))}
                rows={4}
                className="mt-1"
                disabled={existingBid ? !canEdit : !canBid}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={saving || (existingBid ? !canEdit : !canBid)}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : existingBid ? (
                  "Update Bid"
                ) : (
                  "Submit Bid"
                )}
              </Button>
              {existingBid?.status === "pending" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleWithdrawBid}
                  disabled={withdrawing}
                >
                  {withdrawing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      Withdraw
                    </>
                  )}
                </Button>
              )}
              {existingBid?.status === "accepted" && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Accepted by customer
                </div>
              )}
            </div>
          </form>
        </Card>
      </div>
    </PageLayout>
  );
}
