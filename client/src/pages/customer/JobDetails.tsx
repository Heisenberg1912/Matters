import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { jobsApi, progressApi } from "@/lib/api";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
  Star,
  Users,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
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
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { AnimatedModal, AnimatedDialog, StatusBadge } from "@/components/customer";

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
        setJob(response.data.job);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
          <p className="text-gray-600 animate-pulse">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h3>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist</p>
          <Button onClick={() => navigate("/customer/bids")}>Back to Jobs</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/customer/bids")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-gray-600">Posted on {new Date(job.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {job.status === "open" && (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" onClick={() => navigate(`/customer/post-job?edit=${job._id}`)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(true)} className="text-red-600 border-red-300 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Job Description
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </Card>
            </motion.div>

            {/* Job Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                  Job Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-sm font-medium">Budget</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(job.budget.min)} - {formatCurrency(job.budget.max)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{job.budget.type}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Briefcase className="w-5 h-5" />
                      <span className="text-sm font-medium">Work Type</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 capitalize">
                      {job.workType.replace("_", " ")}
                    </p>
                  </div>

                  {job.timeline?.startDate && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm font-medium">Start Date</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(job.timeline.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {job.timeline?.duration && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-medium">Duration</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{job.timeline.duration}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Required Skills */}
            {job.requiredSpecializations.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-6 h-6 text-blue-600" />
                    Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSpecializations.map((skill, index) => (
                      <motion.span
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
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
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-6 h-6 text-green-600" />
                    Assigned Contractor
                  </h2>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                        {job.assignedContractor.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{job.assignedContractor.name}</h3>
                        {job.assignedContractor.company?.name && (
                          <p className="text-gray-600 flex items-center gap-2 mt-1">
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
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">
                              {job.assignedContractor.rating.average.toFixed(1)} ({job.assignedContractor.rating.count} reviews)
                            </span>
                          </div>
                        )}
                        <div className="flex gap-3 mt-4">
                          <a
                            href={`mailto:${job.assignedContractor.email}`}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </a>
                          {job.assignedContractor.phone && (
                            <a
                              href={`tel:${job.assignedContractor.phone}`}
                              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
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
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    Send Message
                  </h2>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Type your message to the contractor..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sending}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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
          <div className="space-y-6">
            {/* Project Info */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Project
                </h3>
                <p className="text-gray-900 font-medium">{job.project.name}</p>
                {job.location && (
                  <p className="text-gray-600 text-sm mt-2 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    {job.location.address || job.location.city}
                  </p>
                )}
              </Card>
            </motion.div>

            {/* Bids Summary */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Bids Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Bids</span>
                    <span className="text-2xl font-bold text-gray-900">{job.bidCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pending</span>
                    <span className="text-lg font-semibold text-orange-600">
                      {job.bids.filter((b) => b.status === "pending").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Accepted</span>
                    <span className="text-lg font-semibold text-green-600">
                      {job.bids.filter((b) => b.status === "accepted").length}
                    </span>
                  </div>
                </div>
                {job.status === "open" && job.bidCount > 0 && (
                  <Button
                    onClick={() => navigate("/customer/bids")}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    View All Bids
                  </Button>
                )}
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate("/customer/progress")}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Progress
                  </Button>
                  <Button
                    onClick={() => navigate(`/home?project=${job.project._id}`)}
                    variant="outline"
                    className="w-full justify-start"
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
    </div>
  );
}
