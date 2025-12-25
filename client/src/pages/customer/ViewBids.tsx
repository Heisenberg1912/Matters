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
      <div className="min-h-[100dvh] bg-[#010101] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 xs:gap-4">
          <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 border-4 border-[#cfe0ad] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs xs:text-sm sm:text-base text-neutral-400 animate-pulse">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#010101] pb-24 xs:pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0a0a] border-b border-[#1f1f1f] sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-5 sm:py-6">
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4">
            <div>
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white">My Jobs & Bids</h1>
              <p className="text-xs xs:text-sm text-neutral-400 mt-0.5 xs:mt-1">Manage your job postings and review contractor bids</p>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => navigate("/customer/post-job")}
                className="flex items-center gap-1.5 xs:gap-2 bg-[#cfe0ad] text-black hover:bg-[#bfd09d] text-sm xs:text-base min-h-[44px]"
              >
                <Plus className="w-4 h-4 xs:w-5 xs:h-5" />
                Post New Job
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6 sm:py-8">
        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6 sm:mb-8"
        >
          <motion.div variants={itemVariants}>
            <Card className="p-3 xs:p-4 sm:p-5 border-l-4 border-l-blue-500 bg-[#101010] border-[#2a2a2a]">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[0.65rem] xs:text-xs sm:text-sm text-neutral-400 font-medium">Total Jobs</p>
                  <p className="text-xl xs:text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="bg-blue-500/20 p-2 xs:p-3 rounded-lg shrink-0">
                  <Briefcase className="w-5 h-5 xs:w-6 xs:h-6 text-blue-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-3 xs:p-4 sm:p-5 border-l-4 border-l-green-500 bg-[#101010] border-[#2a2a2a]">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[0.65rem] xs:text-xs sm:text-sm text-neutral-400 font-medium">Open Jobs</p>
                  <p className="text-xl xs:text-2xl font-bold text-white mt-1">{stats.open}</p>
                </div>
                <div className="bg-green-500/20 p-2 xs:p-3 rounded-lg shrink-0">
                  <Clock className="w-5 h-5 xs:w-6 xs:h-6 text-green-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-3 xs:p-4 sm:p-5 border-l-4 border-l-purple-500 bg-[#101010] border-[#2a2a2a]">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[0.65rem] xs:text-xs sm:text-sm text-neutral-400 font-medium">Total Bids</p>
                  <p className="text-xl xs:text-2xl font-bold text-white mt-1">{stats.totalBids}</p>
                </div>
                <div className="bg-purple-500/20 p-2 xs:p-3 rounded-lg shrink-0">
                  <Users className="w-5 h-5 xs:w-6 xs:h-6 text-purple-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-3 xs:p-4 sm:p-5 border-l-4 border-l-orange-500 bg-[#101010] border-[#2a2a2a]">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[0.65rem] xs:text-xs sm:text-sm text-neutral-400 font-medium">Pending Review</p>
                  <p className="text-xl xs:text-2xl font-bold text-white mt-1">{stats.pendingBids}</p>
                </div>
                <div className="bg-orange-500/20 p-2 xs:p-3 rounded-lg shrink-0">
                  <AlertCircle className="w-5 h-5 xs:w-6 xs:h-6 text-orange-400" />
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
          className="mb-4 xs:mb-6"
        >
          <div className="flex items-center gap-2 mb-3 xs:mb-4">
            <Filter className="w-4 h-4 xs:w-5 xs:h-5 text-neutral-400" />
            <h3 className="font-semibold text-white text-sm xs:text-base">Filter by Status</h3>
          </div>
          <div className="flex flex-wrap gap-2 xs:gap-3">
            {STATUS_FILTERS.map((filter) => {
              const Icon = filter.icon;
              return (
                <motion.button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg font-medium text-xs xs:text-sm transition-all flex items-center gap-1.5 xs:gap-2 min-h-[36px] xs:min-h-[40px] ${
                    statusFilter === filter.value
                      ? "bg-[#cfe0ad] text-black shadow-md"
                      : "bg-[#1a1a1a] text-neutral-300 hover:bg-[#252525] border border-[#2a2a2a]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
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
            className="bg-[#101010] rounded-xl xs:rounded-2xl border border-[#2a2a2a] p-8 xs:p-10 sm:p-12 text-center"
          >
            <Briefcase className="h-14 w-14 xs:h-16 xs:w-16 sm:h-20 sm:w-20 mx-auto text-neutral-600 mb-4" />
            <h3 className="text-lg xs:text-xl font-semibold text-white mb-2">
              {statusFilter === "all" ? "No Jobs Posted" : `No ${statusFilter} Jobs`}
            </h3>
            <p className="text-neutral-400 text-sm xs:text-base mb-6">
              {statusFilter === "all"
                ? "Post a job to start receiving bids from contractors."
                : `You don't have any ${statusFilter} jobs at the moment.`}
            </p>
            {statusFilter === "all" && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={() => navigate("/customer/post-job")} className="bg-[#cfe0ad] text-black hover:bg-[#bfd09d]">
                  <Plus className="w-4 h-4 xs:w-5 xs:h-5 mr-2" />
                  Post Your First Job
                </Button>
              </motion.div>
            )}
            {statusFilter !== "all" && (
              <Button variant="outline" onClick={() => setStatusFilter("all")} className="border-[#2a2a2a] hover:bg-[#1a1a1a] text-white">
                View All Jobs
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3 xs:space-y-4">
            {filteredJobs.map((job) => (
              <motion.div key={job._id} variants={itemVariants}>
                <Card className="overflow-hidden hover:bg-[#151515] transition-all bg-[#101010] border-[#2a2a2a]">
                  {/* Job Header */}
                  <div
                    className="p-4 xs:p-5 sm:p-6 cursor-pointer transition-colors"
                    onClick={() =>
                      selectedJob === job._id ? setSelectedJob(null) : loadBids(job._id)
                    }
                  >
                    <div className="flex items-start justify-between mb-3 xs:mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 mb-2">
                          <h3 className="text-base xs:text-lg sm:text-xl font-bold text-white truncate">{job.title}</h3>
                          {getStatusBadge(job.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 xs:gap-4 text-xs xs:text-sm text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                            {job.project?.name}
                          </span>
                          {job.createdAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                              Posted {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: selectedJob === job._id ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 xs:w-6 xs:h-6 text-neutral-500" />
                      </motion.div>
                    </div>

                    {job.description && (
                      <p className="text-neutral-400 text-sm mb-3 xs:mb-4 line-clamp-2">{job.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 xs:gap-6">
                      <div className="flex items-center gap-1.5 xs:gap-2">
                        <Users className="w-4 h-4 xs:w-5 xs:h-5 text-blue-400" />
                        <span className="font-semibold text-white text-sm xs:text-base">{job.bidCount || 0}</span>
                        <span className="text-neutral-400 text-xs xs:text-sm">
                          {job.bidCount === 1 ? "bid" : "bids"}
                        </span>
                      </div>
                      {job.bidsSummary && job.bidsSummary.pending > 0 && (
                        <div className="flex items-center gap-1.5 xs:gap-2">
                          <Clock className="w-4 h-4 xs:w-5 xs:h-5 text-orange-400" />
                          <span className="font-semibold text-white text-sm xs:text-base">
                            {job.bidsSummary.pending}
                          </span>
                          <span className="text-neutral-400 text-xs xs:text-sm">pending</span>
                        </div>
                      )}
                      {job.budget && (job.budget.min || job.budget.max) && (
                        <div className="flex items-center gap-1.5 xs:gap-2">
                          <DollarSign className="w-4 h-4 xs:w-5 xs:h-5 text-[#cfe0ad]" />
                          <span className="font-semibold text-[#cfe0ad] text-sm xs:text-base">
                            {formatCurrency(job.budget.min || 0)} - {formatCurrency(job.budget.max || 0)}
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
                        className="border-t border-[#2a2a2a] bg-[#0a0a0a] overflow-hidden"
                      >
                        <div className="p-4 xs:p-5 sm:p-6">
                          {loadingBids ? (
                            <div className="flex items-center justify-center py-8 xs:py-12">
                              <div className="w-8 h-8 border-4 border-[#cfe0ad] border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : bids.length === 0 ? (
                            <div className="text-center py-8 xs:py-12">
                              <AlertCircle className="w-12 h-12 xs:w-16 xs:h-16 mx-auto text-neutral-600 mb-4" />
                              <p className="text-white font-medium text-sm xs:text-base">No bids received yet</p>
                              <p className="text-xs xs:text-sm text-neutral-500 mt-2">
                                Contractors will be notified about your job posting
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3 xs:space-y-4">
                              <h4 className="font-semibold text-white text-sm xs:text-base mb-3 xs:mb-4">
                                All Bids ({bids.length})
                              </h4>
                              {bids.map((bid, index) => (
                                <motion.div
                                  key={bid._id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={cn(
                                    "p-4 xs:p-5 rounded-lg xs:rounded-xl border-2 transition-all",
                                    bid.status === "accepted"
                                      ? "border-green-500/30 bg-green-500/10"
                                      : bid.status === "rejected"
                                      ? "border-red-500/20 bg-red-500/5 opacity-70"
                                      : "border-[#2a2a2a] bg-[#151515] hover:border-[#cfe0ad]/30"
                                  )}
                                >
                                  <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-3 xs:gap-4 mb-3 xs:mb-4">
                                    <div className="flex items-center gap-3 xs:gap-4">
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-base xs:text-lg sm:text-xl font-bold shadow-md shrink-0"
                                      >
                                        {bid.contractor?.name?.charAt(0) || "C"}
                                      </motion.div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-white text-sm xs:text-base sm:text-lg truncate">
                                          {bid.contractor?.name}
                                        </p>
                                        {bid.contractor?.company?.name && (
                                          <p className="text-xs xs:text-sm text-neutral-400 truncate">
                                            {bid.contractor.company.name}
                                          </p>
                                        )}
                                        {bid.contractor?.rating && bid.contractor.rating.average > 0 && (
                                          <div className="flex items-center gap-1 mt-1">
                                            {[...Array(5)].map((_, i) => (
                                              <Star
                                                key={i}
                                                className={`w-3 h-3 xs:w-4 xs:h-4 ${
                                                  i < Math.round(bid.contractor.rating.average)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-neutral-600"
                                                }`}
                                              />
                                            ))}
                                            <span className="text-xs xs:text-sm text-neutral-400 ml-1">
                                              ({bid.contractor.rating.average.toFixed(1)})
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-left xs:text-right">
                                      <p className="text-lg xs:text-xl sm:text-2xl font-bold text-[#cfe0ad]">
                                        {formatCurrency(bid.amount)}
                                      </p>
                                      {bid.estimatedDuration && (
                                        <p className="text-xs xs:text-sm text-neutral-400 flex items-center gap-1 xs:justify-end mt-1">
                                          <Clock className="w-3 h-3" />
                                          {bid.estimatedDuration}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="bg-[#1a1a1a] rounded-lg p-3 xs:p-4 mb-3 xs:mb-4 border border-[#2a2a2a]">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-neutral-400" />
                                      <span className="font-semibold text-white text-xs xs:text-sm">Proposal</span>
                                    </div>
                                    <p className="text-neutral-300 text-xs xs:text-sm leading-relaxed">
                                      {bid.proposal}
                                    </p>
                                  </div>

                                  {bid.status === "pending" && job.status === "open" && (
                                    <div className="flex gap-2 xs:gap-3">
                                      <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1"
                                      >
                                        <Button
                                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs xs:text-sm min-h-[40px] xs:min-h-[44px]"
                                          onClick={() => handleAcceptBid(job._id, bid._id)}
                                          disabled={actionLoading === bid._id}
                                        >
                                          {actionLoading === bid._id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <>
                                              <CheckCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5 xs:mr-2" />
                                              Accept
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
                                          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs xs:text-sm min-h-[40px] xs:min-h-[44px]"
                                          onClick={() => handleRejectBid(job._id, bid._id)}
                                          disabled={actionLoading === bid._id}
                                        >
                                          <XCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5 xs:mr-2" />
                                          Reject
                                        </Button>
                                      </motion.div>
                                    </div>
                                  )}

                                  {bid.status === "accepted" && (
                                    <div className="flex items-center justify-center gap-2 text-green-400 font-medium bg-green-500/20 py-2.5 xs:py-3 rounded-lg text-xs xs:text-sm">
                                      <CheckCircle className="w-4 h-4 xs:w-5 xs:h-5" />
                                      Bid Accepted - Contractor Assigned
                                    </div>
                                  )}

                                  {bid.status === "rejected" && (
                                    <div className="flex items-center justify-center gap-2 text-red-400 font-medium bg-red-500/20 py-2.5 xs:py-3 rounded-lg text-xs xs:text-sm">
                                      <XCircle className="w-4 h-4 xs:w-5 xs:h-5" />
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
