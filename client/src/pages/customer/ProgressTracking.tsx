import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { progressApi, type ProgressUpdate, type ProgressSummary } from "@/lib/api";
import {
  Activity,
  Calendar,
  CheckCircle,
  MessageSquare,
  Image as ImageIcon,
  AlertTriangle,
  Users,
  Clock,
  TrendingUp,
  FileText,
  Package,
  Filter,
  ChevronDown,
  Send,
  Loader2,
  Eye,
  CloudRain,
  Sun,
  Cloud,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useProject } from "@/context/ProjectContext";

const UPDATE_TYPES = [
  { value: "all", label: "All Updates", icon: Activity },
  { value: "daily", label: "Daily", icon: Calendar },
  { value: "weekly", label: "Weekly", icon: TrendingUp },
  { value: "milestone", label: "Milestone", icon: CheckCircle },
  { value: "issue", label: "Issues", icon: AlertTriangle },
];

export default function ProgressTracking() {
  const { currentProject } = useProject();
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedUpdate, setSelectedUpdate] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject?._id) {
      loadProgressUpdates();
    }
  }, [currentProject, selectedType]);

  const loadProgressUpdates = async () => {
    if (!currentProject?._id) return;

    try {
      setLoading(true);
      const response = await progressApi.getByProject(
        currentProject._id,
        selectedType !== "all" ? { type: selectedType } : undefined
      );

      if (response.success && response.data) {
        setUpdates(response.data.updates);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error("Error loading progress updates:", error);
      toast.error("Failed to load progress updates");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (updateId: string) => {
    try {
      const response = await progressApi.acknowledge(updateId);
      if (response.success) {
        toast.success("Progress update acknowledged");
        loadProgressUpdates();
      }
    } catch (error) {
      toast.error("Failed to acknowledge update");
    }
  };

  const handleAddComment = async (updateId: string) => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await progressApi.addComment(updateId, newComment);
      if (response.success) {
        toast.success("Comment added");
        setNewComment("");
        loadProgressUpdates();
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const getWeatherIcon = (condition?: string) => {
    if (!condition) return null;
    const lower = condition.toLowerCase();
    if (lower.includes("rain")) return <CloudRain className="w-4 h-4" />;
    if (lower.includes("sun") || lower.includes("clear")) return <Sun className="w-4 h-4" />;
    return <Cloud className="w-4 h-4" />;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: "bg-yellow-100 text-yellow-700",
      medium: "bg-orange-100 text-orange-700",
      high: "bg-red-100 text-red-700",
      critical: "bg-red-200 text-red-900",
    };
    return colors[severity.toLowerCase()] || "bg-gray-100 text-gray-700";
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

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Activity className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-600">Please select a project to view progress updates</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Progress Tracking</h1>
            <p className="text-gray-400 mt-1">Monitor contractor updates and project progress</p>
            {currentProject && (
              <p className="text-sm text-blue-400 mt-2">
                Project: <span className="font-semibold">{currentProject.name}</span>
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <Card className="p-5 bg-gray-800/50 border-gray-700 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-medium">Total Updates</p>
                  <p className="text-2xl font-bold text-white mt-1">{summary.totalUpdates}</p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-gray-800/50 border-gray-700 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-medium">Hours Worked</p>
                  <p className="text-2xl font-bold text-white mt-1">{summary.totalHoursWorked}</p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-gray-800/50 border-gray-700 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-medium">Avg Workers</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {summary.avgWorkersOnSite.toFixed(1)}
                  </p>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-gray-800/50 border-gray-700 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-medium">Open Issues</p>
                  <p className="text-2xl font-bold text-white mt-1">{summary.unresolvedIssues}</p>
                </div>
                <div className="bg-orange-500/20 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-white">Filter by Type</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {UPDATE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <motion.button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                      selectedType === type.value
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading progress updates...</p>
            </div>
          </div>
        )}

        {/* Updates List */}
        {!loading && updates.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Activity className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Progress Updates</h3>
            <p className="text-gray-600">
              {selectedType === "all"
                ? "No progress updates have been submitted yet"
                : `No ${selectedType} updates found`}
            </p>
          </motion.div>
        )}

        {!loading && updates.length > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {updates.map((update, index) => (
              <motion.div key={update._id} variants={itemVariants}>
                <Card className="overflow-hidden bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-all">
                  {/* Update Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-700/30 transition-colors"
                    onClick={() =>
                      setSelectedUpdate(selectedUpdate === update._id ? null : update._id)
                    }
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-3">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">
                              {update.title || `${update.type} Update`}
                            </h3>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                              {update.type}
                            </span>
                          </div>
                          <p className="text-gray-300 mb-3">{update.description}</p>
                          <div className="flex items-center gap-6 text-sm text-gray-400">
                            <span className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {update.contractor.name}
                            </span>
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(update.createdAt).toLocaleDateString()}
                            </span>
                            {update.progressPercentage !== undefined && (
                              <span className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                {update.progressPercentage}% Complete
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: selectedUpdate === update._id ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      </motion.div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="flex items-center gap-4 text-sm">
                      {update.workersOnSite && (
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                          <Users className="w-4 h-4 text-gray-600" />
                          <span>{update.workersOnSite} workers</span>
                        </div>
                      )}
                      {update.hoursWorked && (
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span>{update.hoursWorked} hours</span>
                        </div>
                      )}
                      {update.photoUrls && update.photoUrls.length > 0 && (
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                          <ImageIcon className="w-4 h-4 text-gray-600" />
                          <span>{update.photoUrls.length} photos</span>
                        </div>
                      )}
                      {update.issues && update.issues.length > 0 && (
                        <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full text-red-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{update.issues.length} issues</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {selectedUpdate === update._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-200 overflow-hidden"
                      >
                        <div className="p-6 bg-gray-50 space-y-6">
                          {/* Work Done */}
                          {update.workDone && update.workDone.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                Work Completed
                              </h4>
                              <div className="space-y-2">
                                {update.workDone.map((work, idx) => (
                                  <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className="font-medium text-gray-900">{work.task}</p>
                                        {work.notes && (
                                          <p className="text-sm text-gray-600 mt-1">{work.notes}</p>
                                        )}
                                      </div>
                                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                        {work.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Materials Used */}
                          {update.materialsUsed && update.materialsUsed.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Package className="w-5 h-5 text-purple-600" />
                                Materials Used
                              </h4>
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-2 text-sm font-medium text-gray-600">Material</th>
                                      <th className="text-right py-2 text-sm font-medium text-gray-600">Quantity</th>
                                      <th className="text-right py-2 text-sm font-medium text-gray-600">Cost</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {update.materialsUsed.map((material, idx) => (
                                      <tr key={idx} className="border-b last:border-0">
                                        <td className="py-2 text-gray-900">{material.name}</td>
                                        <td className="text-right text-gray-600">
                                          {material.quantity} {material.unit || "units"}
                                        </td>
                                        <td className="text-right text-gray-900 font-medium">
                                          {material.cost ? `₹${material.cost.toLocaleString()}` : "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Issues */}
                          {update.issues && update.issues.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                Issues & Concerns
                              </h4>
                              <div className="space-y-2">
                                {update.issues.map((issue, idx) => (
                                  <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-l-orange-500">
                                    <div className="flex items-start justify-between mb-2">
                                      <p className="text-gray-900">{issue.description}</p>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                        {issue.severity}
                                      </span>
                                    </div>
                                    {issue.resolved && (
                                      <div className="flex items-center gap-2 text-green-600 text-sm">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Resolved</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Photos */}
                          {update.photoUrls && update.photoUrls.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-blue-600" />
                                Progress Photos
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {update.photoUrls.map((photo, idx) => (
                                  <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.05 }}
                                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                                    onClick={() => setSelectedImage(photo.url)}
                                  >
                                    <img
                                      src={photo.url}
                                      alt={photo.caption || `Progress photo ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                                      <Eye className="w-8 h-8 text-white opacity-0 hover:opacity-100" />
                                    </div>
                                    {photo.caption && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                                        {photo.caption}
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Weather & Additional Info */}
                          {(update.weather || update.nextSteps) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {update.weather && (
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    {getWeatherIcon(update.weather.condition)}
                                    Weather Conditions
                                  </h5>
                                  <p className="text-gray-700">{update.weather.condition}</p>
                                  {update.weather.temperature && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {update.weather.temperature}°C
                                    </p>
                                  )}
                                  {update.weather.impact && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      Impact: {update.weather.impact}
                                    </p>
                                  )}
                                </div>
                              )}
                              {update.nextSteps && (
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                  <h5 className="font-semibold text-gray-900 mb-2">Next Steps</h5>
                                  <p className="text-gray-700">{update.nextSteps}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Comments */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <MessageSquare className="w-5 h-5 text-blue-600" />
                              Comments ({update.comments?.length || 0})
                            </h4>
                            <div className="space-y-3">
                              {update.comments && update.comments.map((comment, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium text-gray-900">{comment.user.name}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(comment.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-700">{comment.text}</p>
                                </div>
                              ))}
                              {/* Add Comment */}
                              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300">
                                <Textarea
                                  placeholder="Add a comment..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="mb-3"
                                  rows={3}
                                />
                                <Button
                                  onClick={() => handleAddComment(update._id)}
                                  disabled={!newComment.trim() || submitting}
                                  className="w-full"
                                >
                                  {submitting ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Posting...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 mr-2" />
                                      Post Comment
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          {!update.customerAcknowledged && (
                            <div className="pt-4 border-t border-gray-200">
                              <Button
                                onClick={() => handleAcknowledge(update._id)}
                                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                              >
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Acknowledge Update
                              </Button>
                            </div>
                          )}
                          {update.customerAcknowledged && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                              <CheckCircle className="w-5 h-5 inline text-green-600 mr-2" />
                              <span className="text-green-700 font-medium">
                                You acknowledged this update
                              </span>
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

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={selectedImage}
              alt="Progress photo"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
