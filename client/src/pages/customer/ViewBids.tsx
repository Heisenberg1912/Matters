import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { jobsApi, type Job, type Bid } from "@/lib/api";
import {
  Briefcase,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  DollarSign,
  Star,
  AlertCircle,
  Loader2,
  Filter,
  Plus,
  TrendingUp,
  Building2,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_FILTERS = [
  { value: "all", label: "All Jobs", icon: Briefcase },
  { value: "open", label: "Open", icon: Clock },
  { value: "assigned", label: "Assigned", icon: CheckCircle },
  { value: "in_progress", label: "In Progress", icon: TrendingUp },
  { value: "completed", label: "Completed", icon: CheckCircle },
];

export default function ViewBids() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<(Job & { bidsSummary?: { total: number; pending: number; accepted: number } })[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<typeof jobs>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter((job) => job.status === statusFilter));
    }
  }, [statusFilter, jobs]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsApi.getMyPostings();
      if (response.success && response.data) {
        setJobs(response.data.jobs);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const loadBids = async (jobId: string) => {
    try {
      setLoadingBids(true);
      setSelectedJob(jobId);
      const response = await jobsApi.getBids(jobId);
      if (response.success && response.data) {
        setBids(response.data.bids);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bids");
    } finally {
      setLoadingBids(false);
    }
  };

  const handleAcceptBid = async (jobId: string, bidId: string) => {
    try {
      setActionLoading(bidId);
      const response = await jobsApi.acceptBid(jobId, bidId);
      if (response.success) {
        toast.success("🎉 Bid accepted! Contractor has been notified.");
        loadJobs();
        loadBids(jobId);
      } else {
        toast.error(response.error || "Failed to accept bid");
      }
    } catch (err) {
      toast.error("Failed to accept bid");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBid = async (jobId: string, bidId: string) => {
    try {
      setActionLoading(bidId);
      const response = await jobsApi.rejectBid(jobId, bidId);
      if (response.success) {
        toast.success("Bid rejected");
        loadBids(jobId);
      } else {
        toast.error(response.error || "Failed to reject bid");
      }
    } catch (err) {
      toast.error("Failed to reject bid");
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      open: { color: "bg-blue-100 text-blue-700", label: "Open" },
      assigned: { color: "bg-green-100 text-green-700", label: "Assigned" },
      in_progress: { color: "bg-yellow-100 text-yellow-700", label: "In Progress" },
      completed: { color: "bg-purple-100 text-purple-700", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-700", label: "Cancelled" },
    };
    const badge = badges[status] || { color: "bg-gray-100 text-gray-700", label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const stats = {
    total: jobs.length,
    open: jobs.filter((j) => j.status === "open").length,
    totalBids: jobs.reduce((sum, j) => sum + (j.bidCount || 0), 0),
    pendingBids: jobs.reduce((sum, j) => sum + (j.bidsSummary?.pending || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 animate-pulse">Loading your jobs...</p>
        </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Jobs & Bids</h1>
              <p className="text-gray-600 mt-1">Manage your job postings and review contractor bids</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate("/customer/post-job")}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
              >
                <Plus className="w-5 h-5" />
                Post New Job
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <motion.div variants={itemVariants}>
            <Card className="p-5 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-5 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Open Jobs</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.open}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-5 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Bids</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBids}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-5 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingBids}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filter by Status</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {STATUS_FILTERS.map((filter) => {
              const Icon = filter.icon;
              return (
                <motion.button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    statusFilter === filter.value
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-md p-12 text-center"
          >
            <Briefcase className="h-20 w-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {statusFilter === "all" ? "No Jobs Posted" : `No ${statusFilter} Jobs`}
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === "all"
                ? "Post a job to start receiving bids from contractors."
                : `You don't have any ${statusFilter} jobs at the moment.`}
            </p>
            {statusFilter === "all" && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => navigate("/customer/post-job")} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Post Your First Job
                </Button>
              </motion.div>
            )}
            {statusFilter !== "all" && (
              <Button variant="outline" onClick={() => setStatusFilter("all")}>
                View All Jobs
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
            {filteredJobs.map((job) => (
              <motion.div key={job._id} variants={itemVariants}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Job Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() =>
                      selectedJob === job._id ? setSelectedJob(null) : loadBids(job._id)
                    }
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          {getStatusBadge(job.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {job.project?.name}
                          </span>
                          {job.createdAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Posted {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: selectedJob === job._id ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      </motion.div>
                    </div>

                    {job.description && (
                      <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
                    )}

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">{job.bidCount || 0}</span>
                        <span className="text-gray-600 text-sm">
                          {job.bidCount === 1 ? "bid" : "bids"}
                        </span>
                      </div>
                      {job.bidsSummary && job.bidsSummary.pending > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <span className="font-semibold text-gray-900">
                            {job.bidsSummary.pending}
                          </span>
                          <span className="text-gray-600 text-sm">pending review</span>
                        </div>
                      )}
                      {job.budget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(job.budget.min)} - {formatCurrency(job.budget.max)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bids Panel */}
                  <AnimatePresence>
                    {selectedJob === job._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-200 bg-gray-50 overflow-hidden"
                      >
                        <div className="p-6">
                          {loadingBids ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                          ) : bids.length === 0 ? (
                            <div className="text-center py-12">
                              <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                              <p className="text-gray-600 font-medium">No bids received yet</p>
                              <p className="text-sm text-gray-500 mt-2">
                                Contractors will be notified about your job posting
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <h4 className="font-semibold text-gray-900 mb-4">
                                All Bids ({bids.length})
                              </h4>
                              {bids.map((bid, index) => (
                                <motion.div
                                  key={bid._id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={cn(
                                    "p-5 rounded-xl border-2 transition-all",
                                    bid.status === "accepted"
                                      ? "border-green-300 bg-green-50"
                                      : bid.status === "rejected"
                                      ? "border-red-200 bg-red-50 opacity-70"
                                      : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                                  )}
                                >
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-md"
                                      >
                                        {bid.contractor?.name?.charAt(0) || "C"}
                                      </motion.div>
                                      <div>
                                        <p className="font-bold text-gray-900 text-lg">
                                          {bid.contractor?.name}
                                        </p>
                                        {bid.contractor?.company?.name && (
                                          <p className="text-sm text-gray-600">
                                            {bid.contractor.company.name}
                                          </p>
                                        )}
                                        {bid.contractor?.rating && bid.contractor.rating.average > 0 && (
                                          <div className="flex items-center gap-1 mt-1">
                                            {[...Array(5)].map((_, i) => (
                                              <Star
                                                key={i}
                                                className={`w-4 h-4 ${
                                                  i < Math.round(bid.contractor.rating.average)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"
                                                }`}
                                              />
                                            ))}
                                            <span className="text-sm text-gray-600 ml-1">
                                              ({bid.contractor.rating.average.toFixed(1)})
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(bid.amount)}
                                      </p>
                                      {bid.estimatedDuration && (
                                        <p className="text-sm text-gray-600 flex items-center gap-1 justify-end mt-1">
                                          <Clock className="w-3 h-3" />
                                          {bid.estimatedDuration}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="w-4 h-4 text-gray-600" />
                                      <span className="font-semibold text-gray-900">Proposal</span>
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                      {bid.proposal}
                                    </p>
                                  </div>

                                  {bid.status === "pending" && job.status === "open" && (
                                    <div className="flex gap-3">
                                      <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1"
                                      >
                                        <Button
                                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                          onClick={() => handleAcceptBid(job._id, bid._id)}
                                          disabled={actionLoading === bid._id}
                                        >
                                          {actionLoading === bid._id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <>
                                              <CheckCircle className="w-4 h-4 mr-2" />
                                              Accept Bid
                                            </>
                                          )}
                                        </Button>
                                      </motion.div>
                                      <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1"
                                      >
                                        <Button
                                          variant="outline"
                                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                          onClick={() => handleRejectBid(job._id, bid._id)}
                                          disabled={actionLoading === bid._id}
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Reject
                                        </Button>
                                      </motion.div>
                                    </div>
                                  )}

                                  {bid.status === "accepted" && (
                                    <div className="flex items-center justify-center gap-2 text-green-600 font-medium bg-green-100 py-3 rounded-lg">
                                      <CheckCircle className="w-5 h-5" />
                                      Bid Accepted - Contractor Assigned
                                    </div>
                                  )}

                                  {bid.status === "rejected" && (
                                    <div className="flex items-center justify-center gap-2 text-red-600 font-medium bg-red-100 py-3 rounded-lg">
                                      <XCircle className="w-5 h-5" />
                                      Bid Rejected
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
