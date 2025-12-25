import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { jobsApi, type Job } from "@/lib/api";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle,
  MapPin,
  PlayCircle,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

export default function MyAssignments() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await jobsApi.getAssigned();
      if (response.success && response.data) {
        setJobs(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      const response = await jobsApi.startJob(jobId);
      if (response.success) {
        toast.success("Job started");
        loadAssignments();
      } else {
        toast.error(response.error || "Failed to start job");
      }
    } catch (err) {
      toast.error("Failed to start job");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      const response = await jobsApi.completeJob(jobId);
      if (response.success) {
        toast.success("Job marked as complete");
        loadAssignments();
      } else {
        toast.error(response.error || "Failed to complete job");
      }
    } catch (err) {
      toast.error("Failed to complete job");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">Assigned</span>;
      case "in_progress":
        return <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs">In Progress</span>;
      case "completed":
        return <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">Completed</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 text-xs">{status}</span>;
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

  if (loading) {
    return (
      <PageLayout title="My Assignments">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="My Assignments">
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <Card className="p-8 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted mb-4" />
            <h3 className="font-semibold mb-2">No Active Assignments</h3>
            <p className="text-sm text-muted mb-4">
              Once a customer accepts your bid, it will appear here.
            </p>
            <Button onClick={() => navigate("/contractor/jobs")}>Browse Jobs</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{job.title}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-muted truncate">{job.project?.name}</p>
                  </div>
                  <button
                    className="text-muted hover:text-[#cfe0ad] transition"
                    onClick={() => navigate(`/contractor/jobs/${job._id}`)}
                  >
                    View
                  </button>
                </div>

                {job.description && (
                  <p className="text-sm text-muted mt-2 line-clamp-2">{job.description}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
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
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted">Budget</p>
                    <p className="text-sm font-medium">{formatBudget(job.budget)}</p>
                  </div>
                  {job.status === "assigned" && (
                    <Button
                      size="sm"
                      onClick={() => handleStart(job._id)}
                      disabled={actionLoading === job._id}
                    >
                      {actionLoading === job._id ? (
                        "Starting..."
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Start Job
                        </>
                      )}
                    </Button>
                  )}
                  {job.status === "in_progress" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate("/contractor/progress", {
                            state: { jobId: job._id, projectId: job.project?._id },
                          })
                        }
                      >
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Submit Update
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleComplete(job._id)}
                        disabled={actionLoading === job._id}
                      >
                        {actionLoading === job._id ? (
                          "Completing..."
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
