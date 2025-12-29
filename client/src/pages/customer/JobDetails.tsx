import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { jobsApi } from "@/lib/api";
import {
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
  Star,
  Users,
  MessageSquare,
  Send,
  Loader2,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  FileText,
  Award,
  TrendingUp,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import { AnimatedDialog, StatusBadge } from "@/components/customer";

interface JobData {
  _id: string;
  title: string;
  description: string;
  status: string;
  budget: { min: number; max: number; currency: string; type: string };
  workType: string;
  requiredSpecializations: string[];
  timeline: { startDate?: string; duration?: string };
  location?: { address?: string; city?: string };
  project: { _id: string; name: string };
  postedBy: { _id: string; name: string };
  assignedContractor?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    company?: { name?: string };
    rating?: { average: number; count: number };
  };
  bids: Array<{
    _id: string;
    contractor: {
      _id: string;
      name: string;
      email: string;
      company?: { name?: string };
      rating?: { average: number; count: number };
    };
    amount: number;
    proposal: string;
    estimatedDuration: string;
    status: string;
  }>;
  bidCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJobDetails();
    }
  }, [jobId]);

  const loadJobDetails = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      const response = await jobsApi.getById(jobId);
      if (response.success && response.data) {
        // API returns job data directly or as response.data
        const jobData = (response.data as unknown as JobData) || response.data;
        setJob(jobData);
      }
    } catch (error) {
      console.error("Error loading job details:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !job?.assignedContractor) return;

    try {
      setSending(true);
      // In a real app, this would send a message to the contractor
      toast.success("Message sent to contractor");
      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobId) return;

    try {
      setDeleting(true);
      const response = await jobsApi.cancel(jobId);
      if (response.success) {
        toast.success("Job cancelled successfully");
        navigate("/customer/bids");
      } else {
        toast.error(response.error || "Failed to cancel job");
      }
    } catch (error) {
      toast.error("Failed to cancel job");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
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
      <PageLayout title="Job Details" showBackButton showBreadcrumbs>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 xs:gap-4">
            <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 border-4 border-[#cfe0ad] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs xs:text-sm sm:text-base text-neutral-400 animate-pulse">Loading job details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!job) {
    return (
      <PageLayout title="Job Details" showBackButton showBreadcrumbs>
        <div className="flex items-center justify-center py-20">
          <Card className="p-6 xs:p-8 text-center max-w-md bg-[#101010] border-[#2a2a2a]">
            <AlertCircle className="w-14 h-14 xs:w-16 xs:h-16 mx-auto text-neutral-600 mb-4" />
            <h3 className="text-lg xs:text-xl font-semibold text-white mb-2">Job Not Found</h3>
            <p className="text-neutral-400 text-sm xs:text-base mb-4">The job you're looking for doesn't exist</p>
            <Button onClick={() => navigate("/customer/bids")} className="bg-[#cfe0ad] text-black hover:bg-[#bfd09d]">Back to Jobs</Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Job Details" showBackButton showBreadcrumbs breadcrumbLabel={job.title}>
      {/* Page Title Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 xs:mb-6"
      >
        <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 mb-1 xs:mb-2">
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white truncate">{job.title}</h1>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-xs xs:text-sm text-neutral-400">Posted on {new Date(job.createdAt).toLocaleDateString()}</p>
        {job.status === "open" && (
          <div className="flex items-center gap-2 mt-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="sm" onClick={() => navigate(`/customer/post-job?edit=${job._id}`)} className="border-[#2a2a2a] hover:bg-[#1a1a1a] text-white">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)} className="text-red-400 border-red-400/30 hover:bg-red-400/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </motion.div>
          </div>
        )}
      </motion.div>

      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 xs:space-y-6">
            {/* Job Description */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a]">
                <h2 className="text-base xs:text-lg sm:text-xl font-bold text-white mb-3 xs:mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 xs:w-6 xs:h-6 text-[#cfe0ad]" />
                  Job Description
                </h2>
                <p className="text-neutral-300 text-sm xs:text-base leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </Card>
            </motion.div>

            {/* Job Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a]">
                <h2 className="text-base xs:text-lg sm:text-xl font-bold text-white mb-3 xs:mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 xs:w-6 xs:h-6 text-[#cfe0ad]" />
                  Job Details
                </h2>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                  <div className="bg-[#1a1a1a] rounded-lg p-3 xs:p-4 border border-[#2a2a2a]">
                    <div className="flex items-center gap-2 text-neutral-400 mb-2">
                      <DollarSign className="w-4 h-4 xs:w-5 xs:h-5" />
                      <span className="text-xs xs:text-sm font-medium">Budget</span>
                    </div>
                    <p className="text-base xs:text-lg font-bold text-[#cfe0ad]">
                      {formatCurrency(job.budget.min)} - {formatCurrency(job.budget.max)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">{job.budget.type}</p>
                  </div>

                  <div className="bg-[#1a1a1a] rounded-lg p-3 xs:p-4 border border-[#2a2a2a]">
                    <div className="flex items-center gap-2 text-neutral-400 mb-2">
                      <Briefcase className="w-4 h-4 xs:w-5 xs:h-5" />
                      <span className="text-xs xs:text-sm font-medium">Work Type</span>
                    </div>
                    <p className="text-base xs:text-lg font-bold text-white capitalize">
                      {job.workType.replace("_", " ")}
                    </p>
                  </div>

                  {job.timeline?.startDate && (
                    <div className="bg-[#1a1a1a] rounded-lg p-3 xs:p-4 border border-[#2a2a2a]">
                      <div className="flex items-center gap-2 text-neutral-400 mb-2">
                        <Calendar className="w-4 h-4 xs:w-5 xs:h-5" />
                        <span className="text-xs xs:text-sm font-medium">Start Date</span>
                      </div>
                      <p className="text-base xs:text-lg font-bold text-white">
                        {new Date(job.timeline.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {job.timeline?.duration && (
                    <div className="bg-[#1a1a1a] rounded-lg p-3 xs:p-4 border border-[#2a2a2a]">
                      <div className="flex items-center gap-2 text-neutral-400 mb-2">
                        <Clock className="w-4 h-4 xs:w-5 xs:h-5" />
                        <span className="text-xs xs:text-sm font-medium">Duration</span>
                      </div>
                      <p className="text-base xs:text-lg font-bold text-white">{job.timeline.duration}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Required Skills */}
            {job.requiredSpecializations.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a]">
                  <h2 className="text-base xs:text-lg sm:text-xl font-bold text-white mb-3 xs:mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 xs:w-6 xs:h-6 text-[#cfe0ad]" />
                    Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSpecializations.map((skill, index) => (
                      <motion.span
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="px-3 xs:px-4 py-1.5 xs:py-2 bg-[#cfe0ad]/20 text-[#cfe0ad] rounded-full text-xs xs:text-sm font-medium"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Assigned Contractor */}
            {job.assignedContractor && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a]">
                  <h2 className="text-base xs:text-lg sm:text-xl font-bold text-white mb-3 xs:mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 xs:w-6 xs:h-6 text-green-400" />
                    Assigned Contractor
                  </h2>
                  <div className="bg-gradient-to-r from-[#0a1a0a] to-[#0a0a1a] rounded-xl p-4 xs:p-5 sm:p-6 border border-green-500/20">
                    <div className="flex flex-col xs:flex-row items-start gap-3 xs:gap-4">
                      <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-lg xs:text-xl sm:text-2xl font-bold shrink-0">
                        {job.assignedContractor.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg xs:text-xl font-bold text-white">{job.assignedContractor.name}</h3>
                        {job.assignedContractor.company?.name && (
                          <p className="text-neutral-400 text-sm flex items-center gap-2 mt-1">
                            <Building2 className="w-4 h-4" />
                            {job.assignedContractor.company.name}
                          </p>
                        )}
                        {job.assignedContractor.rating && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.round(job.assignedContractor!.rating!.average)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-neutral-600"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-neutral-300">
                              {job.assignedContractor.rating.average.toFixed(1)} ({job.assignedContractor.rating.count} reviews)
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 xs:gap-3 mt-3 xs:mt-4">
                          <a
                            href={`mailto:${job.assignedContractor.email}`}
                            className="flex items-center gap-2 px-3 xs:px-4 py-2 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] hover:bg-[#252525] transition-colors text-white text-sm"
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </a>
                          {job.assignedContractor.phone && (
                            <a
                              href={`tel:${job.assignedContractor.phone}`}
                              className="flex items-center gap-2 px-3 xs:px-4 py-2 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] hover:bg-[#252525] transition-colors text-white text-sm"
                            >
                              <Phone className="w-4 h-4" />
                              Call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Communication */}
            {job.assignedContractor && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a]">
                  <h2 className="text-base xs:text-lg sm:text-xl font-bold text-white mb-3 xs:mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 xs:w-6 xs:h-6 text-[#cfe0ad]" />
                    Send Message
                  </h2>
                  <div className="space-y-3 xs:space-y-4">
                    <Textarea
                      placeholder="Type your message to the contractor..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="resize-none bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-neutral-500"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sending}
                      className="w-full bg-[#cfe0ad] text-black hover:bg-[#bfd09d]"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 xs:space-y-6">
            {/* Project Info */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a]">
                <h3 className="font-bold text-white mb-3 xs:mb-4 flex items-center gap-2 text-sm xs:text-base">
                  <Building2 className="w-4 h-4 xs:w-5 xs:h-5 text-[#cfe0ad]" />
                  Project
                </h3>
                <p className="text-white font-medium text-sm xs:text-base">{job.project.name}</p>
                {job.location && (
                  <p className="text-neutral-400 text-xs xs:text-sm mt-2 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    {job.location.address || job.location.city}
                  </p>
                )}
              </Card>
            </motion.div>

            {/* Bids Summary */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a]">
                <h3 className="font-bold text-white mb-3 xs:mb-4 flex items-center gap-2 text-sm xs:text-base">
                  <TrendingUp className="w-4 h-4 xs:w-5 xs:h-5 text-purple-400" />
                  Bids Summary
                </h3>
                <div className="space-y-2 xs:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-sm">Total Bids</span>
                    <span className="text-xl xs:text-2xl font-bold text-white">{job.bidCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-sm">Pending</span>
                    <span className="text-base xs:text-lg font-semibold text-orange-400">
                      {job.bids.filter((b) => b.status === "pending").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-sm">Accepted</span>
                    <span className="text-base xs:text-lg font-semibold text-green-400">
                      {job.bids.filter((b) => b.status === "accepted").length}
                    </span>
                  </div>
                </div>
                {job.status === "open" && job.bidCount > 0 && (
                  <Button
                    onClick={() => navigate("/customer/bids")}
                    variant="outline"
                    className="w-full mt-4 border-[#2a2a2a] hover:bg-[#1a1a1a] text-white text-sm"
                  >
                    View All Bids
                  </Button>
                )}
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a]">
                <h3 className="font-bold text-white mb-3 xs:mb-4 text-sm xs:text-base">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate("/customer/progress")}
                    variant="outline"
                    className="w-full justify-start border-[#2a2a2a] hover:bg-[#1a1a1a] text-white text-sm"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Progress
                  </Button>
                  <Button
                    onClick={() => navigate(`/home?project=${job.project._id}`)}
                    variant="outline"
                    className="w-full justify-start border-[#2a2a2a] hover:bg-[#1a1a1a] text-white text-sm"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    View Project
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatedDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteJob}
        title="Cancel Job?"
        description="Are you sure you want to cancel this job? This action cannot be undone and all pending bids will be rejected."
        confirmText="Yes, Cancel Job"
        cancelText="Keep Job"
        variant="danger"
        loading={deleting}
      />
    </PageLayout>
  );
}
