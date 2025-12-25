import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { jobsApi, progressApi, type Job } from "@/lib/api";
import { AlertCircle, Loader2, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

const UPDATE_TYPES = [
  { value: "daily_update", label: "Daily Update" },
  { value: "milestone", label: "Milestone" },
  { value: "inspection", label: "Inspection" },
  { value: "issue", label: "Issue" },
  { value: "material_delivery", label: "Material Delivery" },
];

const ISSUE_SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function SubmitProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselected = (location.state as { jobId?: string; projectId?: string } | null) || null;

  const [assignedJobs, setAssignedJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    jobId: "",
    projectId: "",
    type: "daily_update",
    title: "",
    description: "",
    progressPercentage: "",
    hoursWorked: "",
    workersOnSite: "",
    nextSteps: "",
    issueDescription: "",
    issueSeverity: "medium",
  });

  useEffect(() => {
    loadAssignedJobs();
  }, []);

  const loadAssignedJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await jobsApi.getAssigned();
      if (response.success && response.data) {
        setAssignedJobs(response.data);
        const nextJobId = preselected?.jobId || response.data[0]?._id || "";
        const nextJob = response.data.find((job) => job._id === nextJobId) || response.data[0];
        setFormData((prev) => ({
          ...prev,
          jobId: nextJobId,
          projectId: preselected?.projectId || nextJob?.project?._id || "",
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleJobChange = (jobId: string) => {
    const job = assignedJobs.find((item) => item._id === jobId);
    setFormData((prev) => ({
      ...prev,
      jobId,
      projectId: job?.project?._id || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId) {
      toast.error("Select an assigned job");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    try {
      setSaving(true);
      const response = await progressApi.create({
        projectId: formData.projectId,
        jobId: formData.jobId || undefined,
        type: formData.type,
        title: formData.title.trim() || undefined,
        description: formData.description.trim(),
        progressPercentage: formData.progressPercentage
          ? Number(formData.progressPercentage)
          : undefined,
        hoursWorked: formData.hoursWorked ? Number(formData.hoursWorked) : undefined,
        workersOnSite: formData.workersOnSite ? Number(formData.workersOnSite) : undefined,
        nextSteps: formData.nextSteps.trim() || undefined,
        issues: formData.issueDescription.trim()
          ? [{ description: formData.issueDescription.trim(), severity: formData.issueSeverity }]
          : undefined,
      });

      if (response.success) {
        toast.success("Progress update submitted");
        setFormData((prev) => ({
          ...prev,
          title: "",
          description: "",
          progressPercentage: "",
          hoursWorked: "",
          workersOnSite: "",
          nextSteps: "",
          issueDescription: "",
          issueSeverity: "medium",
        }));
      } else {
        toast.error(response.error || "Failed to submit update");
      }
    } catch (err) {
      toast.error("Failed to submit update");
    } finally {
      setSaving(false);
    }
  };

  if (loadingJobs) {
    return (
      <PageLayout title="Submit Progress">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      </PageLayout>
    );
  }

  if (assignedJobs.length === 0) {
    return (
      <PageLayout title="Submit Progress">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted mb-4" />
          <h3 className="font-semibold mb-2">No Active Assignments</h3>
          <p className="text-sm text-muted mb-4">
            Once you have an assigned job, you can submit progress updates here.
          </p>
          <Button onClick={() => navigate("/contractor/jobs")}>Find Jobs</Button>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Submit Progress">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5 space-y-4">
          <div>
            <Label className="mb-2 block">Assigned Job</Label>
            <select
              value={formData.jobId}
              onChange={(e) => handleJobChange(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-[#1a1a1a] border border-border appearance-none cursor-pointer"
            >
              {assignedJobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} - {job.project?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="mb-2 block">Update Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {UPDATE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: type.value }))}
                  className={`p-3 rounded-lg border text-sm transition ${
                    formData.type === type.value
                      ? "border-[#cfe0ad] bg-[#cfe0ad]/10 text-[#cfe0ad]"
                      : "border-border hover:border-[#cfe0ad]/50"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Progress Details</h3>
          <div>
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Completed foundation pouring"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe work completed, materials used, and any blockers..."
              rows={4}
              className="mt-1"
            />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="progressPercentage">Progress (%)</Label>
              <Input
                id="progressPercentage"
                type="number"
                value={formData.progressPercentage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, progressPercentage: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hoursWorked">Hours Worked</Label>
              <Input
                id="hoursWorked"
                type="number"
                value={formData.hoursWorked}
                onChange={(e) => setFormData((prev) => ({ ...prev, hoursWorked: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="workersOnSite">Workers On Site</Label>
              <Input
                id="workersOnSite"
                type="number"
                value={formData.workersOnSite}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, workersOnSite: e.target.value }))
                }
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Issues (Optional)</h3>
          <div>
            <Label htmlFor="issueDescription">Issue Description</Label>
            <Textarea
              id="issueDescription"
              value={formData.issueDescription}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, issueDescription: e.target.value }))
              }
              rows={3}
              className="mt-1"
              placeholder="Describe any blockers or risks"
            />
          </div>
          <div>
            <Label className="mb-2 block">Severity</Label>
            <div className="flex gap-2">
              {ISSUE_SEVERITIES.map((severity) => (
                <button
                  key={severity.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, issueSeverity: severity.value }))
                  }
                  className={`px-3 py-1.5 rounded-full text-xs transition ${
                    formData.issueSeverity === severity.value
                      ? "bg-[#cfe0ad] text-black"
                      : "bg-[#1a1a1a] hover:bg-[#2a2a2a]"
                  }`}
                >
                  {severity.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Next Steps</h3>
          <Textarea
            value={formData.nextSteps}
            onChange={(e) => setFormData((prev) => ({ ...prev, nextSteps: e.target.value }))}
            rows={3}
            placeholder="What is planned for the next update?"
          />
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              Submit Update
            </>
          )}
        </Button>
      </form>
    </PageLayout>
  );
}
