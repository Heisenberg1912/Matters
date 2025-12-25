import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { jobsApi, projectsApi } from "@/lib/api";
import {
  Briefcase,
  ChevronDown,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  MapPin,
  Calendar,
  DollarSign,
  Wrench,
  FileText,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

const SPECIALIZATIONS = [
  "Civil Work",
  "Electrical",
  "Plumbing",
  "Painting",
  "Carpentry",
  "Flooring",
  "Roofing",
  "HVAC",
  "Landscaping",
  "Interior Design",
  "Masonry",
  "Welding",
];

const WORK_TYPES = [
  { value: "full_construction", label: "Full Construction", icon: "🏗️" },
  { value: "renovation", label: "Renovation", icon: "🔨" },
  { value: "repair", label: "Repair", icon: "🔧" },
  { value: "consultation", label: "Consultation", icon: "💡" },
  { value: "supervision", label: "Supervision", icon: "👷" },
  { value: "specific_task", label: "Specific Task", icon: "📋" },
];

interface Project {
  _id: string;
  name: string;
  location?: { city?: string; state?: string };
}

const STEPS = [
  { id: 1, title: "Project", icon: MapPin },
  { id: 2, title: "Details", icon: FileText },
  { id: 3, title: "Budget", icon: DollarSign },
  { id: 4, title: "Skills", icon: Wrench },
  { id: 5, title: "Timeline", icon: Calendar },
];

export default function PostJob() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [formData, setFormData] = useState({
    projectId: "",
    title: "",
    description: "",
    budgetMin: "",
    budgetMax: "",
    budgetType: "fixed",
    workType: "specific_task",
    specializations: [] as string[],
    startDate: "",
    duration: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await projectsApi.getAll({ limit: 100 });
      if (response.success && response.data?.projects) {
        setProjects(response.data.projects);
        if (response.data.projects.length > 0) {
          setFormData((prev) => ({
            ...prev,
            projectId: response.data!.projects[0]._id,
          }));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleSpecializationToggle = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.projectId) {
        newErrors.projectId = "Please select a project";
      }
    } else if (step === 2) {
      if (!formData.title.trim()) {
        newErrors.title = "Job title is required";
      } else if (formData.title.length < 5) {
        newErrors.title = "Title must be at least 5 characters";
      }
      if (!formData.description.trim()) {
        newErrors.description = "Job description is required";
      } else if (formData.description.length < 20) {
        newErrors.description = "Description must be at least 20 characters";
      }
    } else if (step === 3) {
      if (formData.budgetMin && formData.budgetMax) {
        const min = parseInt(formData.budgetMin);
        const max = parseInt(formData.budgetMax);
        if (min >= max) {
          newErrors.budget = "Maximum budget must be greater than minimum";
        }
      }
    } else if (step === 4) {
      if (formData.specializations.length === 0) {
        newErrors.specializations = "Select at least one specialization";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    if (!formData.projectId || !formData.title.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const response = await jobsApi.create({
        projectId: formData.projectId,
        title: formData.title,
        description: formData.description,
        budget: {
          min: formData.budgetMin ? parseInt(formData.budgetMin) : undefined,
          max: formData.budgetMax ? parseInt(formData.budgetMax) : undefined,
          type: formData.budgetType,
        },
        workType: formData.workType,
        requiredSpecializations: formData.specializations,
        timeline: {
          startDate: formData.startDate || undefined,
          duration: formData.duration || undefined,
        },
      });

      if (response.success) {
        toast.success("🎉 Job posted successfully!");
        navigate("/customer/bids");
      } else {
        toast.error(response.error || "Failed to post job");
      }
    } catch (err) {
      toast.error("Failed to post job");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const stepVariants = {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  };

  if (loadingProjects) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 animate-pulse">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="min-h-screen flex items-center justify-center px-4 pb-20"
      >
        <Card className="p-8 text-center max-w-md w-full border-2 border-dashed">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <Briefcase className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          </motion.div>
          <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
          <p className="text-sm text-gray-600 mb-6">
            You need to create a project before posting a job.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => navigate("/home")} size="lg">
              Create Your First Project
            </Button>
          </motion.div>
        </Card>
      </motion.div>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="bg-blue-500/20 p-3 rounded-lg"
              whileHover={{ rotate: 5 }}
            >
              <Briefcase className="w-6 h-6 text-blue-400" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white">Post a New Job</h1>
              <p className="text-gray-400 text-sm">Find the perfect contractor for your project</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-700 rounded-full">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Step Indicators */}
            <div className="relative flex justify-between">
              {STEPS.map((step) => {
                const StepIcon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <motion.div
                    key={step.id}
                    className="flex flex-col items-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 * step.id }}
                  >
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                          : "bg-gray-700 border-2 border-gray-600 text-gray-400"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </motion.div>
                    <span className={`text-xs mt-2 font-medium ${isCurrent ? "text-blue-400" : "text-gray-400"}`}>
                      {step.title}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 100 }}
          >
            {/* Step 1: Project Selection */}
            {currentStep === 1 && (
              <Card className="p-6 bg-gray-800/50 border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <MapPin className="w-6 h-6 text-blue-400" />
                  Select Your Project
                </h2>
                <p className="text-gray-400 mb-6">Which project is this job for?</p>

                <div className="space-y-3">
                  {projects.map((project) => (
                    <motion.button
                      key={project._id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, projectId: project._id }));
                        setErrors((prev) => ({ ...prev, projectId: "" }));
                      }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        formData.projectId === project._id
                          ? "border-blue-600 bg-blue-500/10 shadow-md"
                          : "border-gray-600 hover:border-blue-400 bg-gray-700/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{project.name}</p>
                          {project.location?.city && (
                            <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {project.location.city}
                              {project.location.state && `, ${project.location.state}`}
                            </p>
                          )}
                        </div>
                        {formData.projectId === project._id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-blue-600 rounded-full p-1"
                          >
                            <Check className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
                {errors.projectId && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-2"
                  >
                    {errors.projectId}
                  </motion.p>
                )}
              </Card>
            )}

            {/* Step 2: Job Details */}
            {currentStep === 2 && (
              <Card className="p-6 bg-gray-800/50 border-gray-700 space-y-5">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <FileText className="w-6 h-6 text-blue-400" />
                  Job Details
                </h2>

                <div>
                  <Label htmlFor="title" className="flex items-center gap-2">
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Electrical Wiring for 3 Floors"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, title: e.target.value }));
                      setErrors((prev) => ({ ...prev, title: "" }));
                    }}
                    className={`mt-1 ${errors.title ? "border-red-500" : ""}`}
                  />
                  {errors.title && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1"
                    >
                      {errors.title}
                    </motion.p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description" className="flex items-center gap-2">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the work required in detail... Include specific requirements, materials, and any important details contractors should know."
                    value={formData.description}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, description: e.target.value }));
                      setErrors((prev) => ({ ...prev, description: "" }));
                    }}
                    rows={6}
                    className={`mt-1 ${errors.description ? "border-red-500" : ""}`}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description ? (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm"
                      >
                        {errors.description}
                      </motion.p>
                    ) : (
                      <p className="text-xs text-gray-500">Be as detailed as possible</p>
                    )}
                    <p className="text-xs text-gray-500">{formData.description.length} characters</p>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Work Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {WORK_TYPES.map((type) => (
                      <motion.button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, workType: type.value }))
                        }
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-4 rounded-lg border-2 text-sm transition-all ${
                          formData.workType === type.value
                            ? "border-blue-600 bg-blue-500/10 shadow-md text-white"
                            : "border-gray-600 hover:border-blue-400 bg-gray-700/30 text-gray-300"
                        }`}
                      >
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="font-medium">{type.label}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Step 3: Budget */}
            {currentStep === 3 && (
              <Card className="p-6 bg-gray-800/50 border-gray-700 space-y-5">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <DollarSign className="w-6 h-6 text-blue-400" />
                  Set Your Budget
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budgetMin">Minimum Budget (₹)</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      placeholder="50,000"
                      value={formData.budgetMin}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, budgetMin: e.target.value }));
                        setErrors((prev) => ({ ...prev, budget: "" }));
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budgetMax">Maximum Budget (₹)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      placeholder="100,000"
                      value={formData.budgetMax}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, budgetMax: e.target.value }));
                        setErrors((prev) => ({ ...prev, budget: "" }));
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>

                {errors.budget && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm"
                  >
                    {errors.budget}
                  </motion.p>
                )}

                {formData.budgetMin && formData.budgetMax && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
                  >
                    <p className="text-sm text-gray-300">
                      Your budget range:{" "}
                      <span className="font-bold text-blue-400">
                        ₹{parseInt(formData.budgetMin).toLocaleString("en-IN")} - ₹
                        {parseInt(formData.budgetMax).toLocaleString("en-IN")}
                      </span>
                    </p>
                  </motion.div>
                )}

                <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                  <p className="text-sm text-gray-300">
                    💡 <strong>Tip:</strong> A realistic budget attracts quality contractors and
                    increases your chances of getting better bids.
                  </p>
                </div>
              </Card>
            )}

            {/* Step 4: Specializations */}
            {currentStep === 4 && (
              <Card className="p-6 bg-gray-800/50 border-gray-700 space-y-5">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <Wrench className="w-6 h-6 text-blue-400" />
                  Required Skills
                </h2>
                <p className="text-gray-400">
                  Select the specializations needed for this job
                </p>

                <div className="flex flex-wrap gap-3">
                  {SPECIALIZATIONS.map((spec) => (
                    <motion.button
                      key={spec}
                      type="button"
                      onClick={() => {
                        handleSpecializationToggle(spec);
                        setErrors((prev) => ({ ...prev, specializations: "" }));
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.specializations.includes(spec)
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                      }`}
                    >
                      {formData.specializations.includes(spec) && (
                        <Check className="w-4 h-4 inline mr-1" />
                      )}
                      {spec}
                    </motion.button>
                  ))}
                </div>

                {errors.specializations && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm"
                  >
                    {errors.specializations}
                  </motion.p>
                )}

                {formData.specializations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
                  >
                    <p className="text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 inline text-green-400 mr-1" />
                      <strong>{formData.specializations.length}</strong> skill
                      {formData.specializations.length !== 1 ? "s" : ""} selected
                    </p>
                  </motion.div>
                )}
              </Card>
            )}

            {/* Step 5: Timeline */}
            {currentStep === 5 && (
              <Card className="p-6 bg-gray-800/50 border-gray-700 space-y-5">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <Calendar className="w-6 h-6 text-blue-400" />
                  Project Timeline
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Expected Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="mt-1"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Estimated Duration</Label>
                    <Input
                      id="duration"
                      placeholder="e.g., 2 weeks, 1 month"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, duration: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-gray-300">
                    ℹ️ These fields are optional but help contractors plan their schedule better.
                  </p>
                </div>

                {/* Summary */}
                <div className="mt-6 bg-gray-700/30 rounded-lg p-5 border-2 border-dashed border-gray-600">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    Review Your Job Posting
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-400">Project</p>
                      <p className="font-semibold text-white">
                        {projects.find((p) => p._id === formData.projectId)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Job Title</p>
                      <p className="font-semibold text-white">{formData.title}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Work Type</p>
                      <p className="font-semibold text-white">
                        {WORK_TYPES.find((t) => t.value === formData.workType)?.label}
                      </p>
                    </div>
                    {formData.budgetMin && formData.budgetMax && (
                      <div>
                        <p className="text-gray-400">Budget Range</p>
                        <p className="font-semibold text-green-400">
                          ₹{parseInt(formData.budgetMin).toLocaleString("en-IN")} - ₹
                          {parseInt(formData.budgetMax).toLocaleString("en-IN")}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400">Required Skills</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.specializations.map((spec) => (
                          <span
                            key={spec}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mt-8"
        >
          {currentStep > 1 ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
            </motion.div>
          ) : (
            <div />
          )}

          {currentStep < STEPS.length ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Post Job
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
