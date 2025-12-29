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
      <div className="min-h-[100dvh] bg-[#010101] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 xs:gap-4">
          <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 border-4 border-[#cfe0ad] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs xs:text-sm sm:text-base text-neutral-400 animate-pulse">Loading projects...</p>
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
        className="min-h-[100dvh] bg-[#010101] flex items-center justify-center px-4 pb-28"
      >
        <Card className="p-5 xs:p-6 sm:p-8 text-center max-w-[340px] xs:max-w-sm sm:max-w-md w-full border-2 border-dashed border-[#2a2a2a] bg-[#101010]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <Briefcase className="h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 mx-auto text-neutral-500 mb-3 xs:mb-4" />
          </motion.div>
          <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-white mb-1 xs:mb-2">No Projects Found</h3>
          <p className="text-xs xs:text-sm text-neutral-400 mb-4 xs:mb-6">
            You need to create a project before posting a job.
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => navigate("/home")} size="lg" className="bg-[#cfe0ad] text-black hover:bg-[#bfd09d] text-sm xs:text-base min-h-[44px]">
              Create Your First Project
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#010101] pb-28 xs:pb-32 sm:pb-36">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0a0a] border-b border-[#1f1f1f] sticky top-0 z-10"
      >
        <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-5 sm:py-6">
          <div className="flex items-center gap-2 xs:gap-3">
            <motion.div
              className="bg-[#cfe0ad]/20 p-2 xs:p-3 rounded-lg"
              whileHover={{ rotate: 5 }}
            >
              <Briefcase className="w-5 h-5 xs:w-6 xs:h-6 text-[#cfe0ad]" />
            </motion.div>
            <div>
              <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-white">Post a New Job</h1>
              <p className="text-xs xs:text-sm text-neutral-400">Find the perfect contractor for your project</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6 sm:py-8">
        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 xs:mb-6 sm:mb-8"
        >
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-4 xs:top-5 left-0 right-0 h-0.5 xs:h-1 bg-[#1f1f1f] rounded-full">
              <motion.div
                className="h-full bg-[#cfe0ad] rounded-full"
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
                      className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-[#cfe0ad] text-black"
                          : isCurrent
                          ? "bg-[#cfe0ad] text-black shadow-lg shadow-[#cfe0ad]/30"
                          : "bg-[#1a1a1a] border-2 border-[#2a2a2a] text-neutral-500"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 xs:w-5 xs:h-5" />
                      ) : (
                        <StepIcon className="w-4 h-4 xs:w-5 xs:h-5" />
                      )}
                    </motion.div>
                    <span className={`text-[0.6rem] xs:text-xs mt-1 xs:mt-2 font-medium hidden xs:block ${isCurrent ? "text-[#cfe0ad]" : "text-neutral-500"}`}>
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
              <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a]">
                <h2 className="text-base xs:text-lg sm:text-xl font-bold mb-3 xs:mb-4 flex items-center gap-2 text-white">
                  <MapPin className="w-5 h-5 xs:w-6 xs:h-6 text-[#cfe0ad]" />
                  Select Your Project
                </h2>
                <p className="text-xs xs:text-sm text-neutral-400 mb-4 xs:mb-6">Which project is this job for?</p>

                <div className="space-y-2 xs:space-y-3">
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
                      className={`w-full p-3 xs:p-4 rounded-lg border-2 text-left transition-all min-h-[44px] ${
                        formData.projectId === project._id
                          ? "border-[#cfe0ad] bg-[#cfe0ad]/10 shadow-md"
                          : "border-[#2a2a2a] hover:border-[#cfe0ad]/50 bg-[#1a1a1a]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm xs:text-base font-semibold text-white">{project.name}</p>
                          {project.location?.city && (
                            <p className="text-xs xs:text-sm text-neutral-400 flex items-center gap-1 mt-1">
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
                            className="bg-[#cfe0ad] rounded-full p-1"
                          >
                            <Check className="w-4 h-4 xs:w-5 xs:h-5 text-black" />
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
                    className="text-red-400 text-xs xs:text-sm mt-2"
                  >
                    {errors.projectId}
                  </motion.p>
                )}
              </Card>
            )}

            {/* Step 2: Job Details */}
            {currentStep === 2 && (
              <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a] space-y-4 xs:space-y-5">
                <h2 className="text-base xs:text-lg sm:text-xl font-bold mb-3 xs:mb-4 flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 xs:w-6 xs:h-6 text-[#cfe0ad]" />
                  Job Details
                </h2>

                <div>
                  <Label htmlFor="title" className="flex items-center gap-2 text-sm xs:text-base">
                    Job Title <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Electrical Wiring for 3 Floors"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, title: e.target.value }));
                      setErrors((prev) => ({ ...prev, title: "" }));
                    }}
                    className={`mt-1 text-sm xs:text-base min-h-[44px] ${errors.title ? "border-red-400" : ""}`}
                  />
                  {errors.title && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs xs:text-sm mt-1"
                    >
                      {errors.title}
                    </motion.p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description" className="flex items-center gap-2 text-sm xs:text-base">
                    Description <span className="text-red-400">*</span>
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
                    className={`mt-1 text-sm xs:text-base ${errors.description ? "border-red-400" : ""}`}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description ? (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs xs:text-sm"
                      >
                        {errors.description}
                      </motion.p>
                    ) : (
                      <p className="text-[0.65rem] xs:text-xs text-neutral-500">Be as detailed as possible</p>
                    )}
                    <p className="text-[0.65rem] xs:text-xs text-neutral-500">{formData.description.length} characters</p>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 xs:mb-3 block text-sm xs:text-base">Work Type</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3">
                    {WORK_TYPES.map((type) => (
                      <motion.button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, workType: type.value }))
                        }
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-3 xs:p-4 rounded-lg border-2 text-xs xs:text-sm transition-all min-h-[44px] ${
                          formData.workType === type.value
                            ? "border-[#cfe0ad] bg-[#cfe0ad]/10 shadow-md text-white"
                            : "border-[#2a2a2a] hover:border-[#cfe0ad]/50 bg-[#1a1a1a] text-neutral-300"
                        }`}
                      >
                        <div className="text-xl xs:text-2xl mb-1 xs:mb-2">{type.icon}</div>
                        <div className="font-medium">{type.label}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Step 3: Budget */}
            {currentStep === 3 && (
              <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a] space-y-4 xs:space-y-5">
                <h2 className="text-base xs:text-lg sm:text-xl font-bold mb-3 xs:mb-4 flex items-center gap-2 text-white">
                  <DollarSign className="w-5 h-5 xs:w-6 xs:h-6 text-[#cfe0ad]" />
                  Set Your Budget
                </h2>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                  <div>
                    <Label htmlFor="budgetMin" className="text-sm xs:text-base">Minimum Budget (₹)</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      placeholder="50,000"
                      value={formData.budgetMin}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, budgetMin: e.target.value }));
                        setErrors((prev) => ({ ...prev, budget: "" }));
                      }}
                      className="mt-1 text-sm xs:text-base min-h-[44px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budgetMax" className="text-sm xs:text-base">Maximum Budget (₹)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      placeholder="100,000"
                      value={formData.budgetMax}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, budgetMax: e.target.value }));
                        setErrors((prev) => ({ ...prev, budget: "" }));
                      }}
                      className="mt-1 text-sm xs:text-base min-h-[44px]"
                    />
                  </div>
                </div>

                {errors.budget && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs xs:text-sm"
                  >
                    {errors.budget}
                  </motion.p>
                )}

                {formData.budgetMin && formData.budgetMax && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#cfe0ad]/10 border border-[#cfe0ad]/20 rounded-lg p-3 xs:p-4"
                  >
                    <p className="text-xs xs:text-sm text-neutral-300">
                      Your budget range:{" "}
                      <span className="font-bold text-[#cfe0ad]">
                        ₹{parseInt(formData.budgetMin).toLocaleString("en-IN")} - ₹
                        {parseInt(formData.budgetMax).toLocaleString("en-IN")}
                      </span>
                    </p>
                  </motion.div>
                )}

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 xs:p-4">
                  <p className="text-xs xs:text-sm text-neutral-300">
                    💡 <strong>Tip:</strong> A realistic budget attracts quality contractors and
                    increases your chances of getting better bids.
                  </p>
                </div>
              </Card>
            )}

            {/* Step 4: Specializations */}
            {currentStep === 4 && (
              <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a] space-y-4 xs:space-y-5">
                <h2 className="text-base xs:text-lg sm:text-xl font-bold mb-3 xs:mb-4 flex items-center gap-2 text-white">
                  <Wrench className="w-5 h-5 xs:w-6 xs:h-6 text-[#cfe0ad]" />
                  Required Skills
                </h2>
                <p className="text-xs xs:text-sm text-neutral-400">
                  Select the specializations needed for this job
                </p>

                <div className="flex flex-wrap gap-2 xs:gap-3">
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
                      className={`px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-xs xs:text-sm font-medium transition-all min-h-[36px] xs:min-h-[40px] ${
                        formData.specializations.includes(spec)
                          ? "bg-[#cfe0ad] text-black shadow-md"
                          : "bg-[#1a1a1a] text-neutral-300 hover:bg-[#252525] border border-[#2a2a2a]"
                      }`}
                    >
                      {formData.specializations.includes(spec) && (
                        <Check className="w-3 h-3 xs:w-4 xs:h-4 inline mr-1" />
                      )}
                      {spec}
                    </motion.button>
                  ))}
                </div>

                {errors.specializations && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs xs:text-sm"
                  >
                    {errors.specializations}
                  </motion.p>
                )}

                {formData.specializations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#cfe0ad]/10 border border-[#cfe0ad]/20 rounded-lg p-3 xs:p-4"
                  >
                    <p className="text-xs xs:text-sm text-neutral-300">
                      <CheckCircle2 className="w-3 h-3 xs:w-4 xs:h-4 inline text-[#cfe0ad] mr-1" />
                      <strong>{formData.specializations.length}</strong> skill
                      {formData.specializations.length !== 1 ? "s" : ""} selected
                    </p>
                  </motion.div>
                )}
              </Card>
            )}

            {/* Step 5: Timeline */}
            {currentStep === 5 && (
              <Card className="p-4 xs:p-5 sm:p-6 bg-[#101010] border-[#2a2a2a] space-y-4 xs:space-y-5">
                <h2 className="text-base xs:text-lg sm:text-xl font-bold mb-3 xs:mb-4 flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5 xs:w-6 xs:h-6 text-[#cfe0ad]" />
                  Project Timeline
                </h2>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-sm xs:text-base">Expected Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="mt-1 text-sm xs:text-base min-h-[44px]"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration" className="text-sm xs:text-base">Estimated Duration</Label>
                    <Input
                      id="duration"
                      placeholder="e.g., 2 weeks, 1 month"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, duration: e.target.value }))
                      }
                      className="mt-1 text-sm xs:text-base min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="bg-[#cfe0ad]/10 border border-[#cfe0ad]/20 rounded-lg p-3 xs:p-4">
                  <p className="text-xs xs:text-sm text-neutral-300">
                    ℹ️ These fields are optional but help contractors plan their schedule better.
                  </p>
                </div>

                {/* Summary */}
                <div className="mt-4 xs:mt-6 bg-[#1a1a1a] rounded-lg p-4 xs:p-5 border-2 border-dashed border-[#2a2a2a]">
                  <h3 className="text-sm xs:text-base font-bold text-white mb-3 xs:mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 xs:w-5 xs:h-5 text-[#cfe0ad]" />
                    Review Your Job Posting
                  </h3>
                  <div className="space-y-2 xs:space-y-3 text-xs xs:text-sm">
                    <div>
                      <p className="text-neutral-500">Project</p>
                      <p className="font-semibold text-white">
                        {projects.find((p) => p._id === formData.projectId)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Job Title</p>
                      <p className="font-semibold text-white">{formData.title}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Work Type</p>
                      <p className="font-semibold text-white">
                        {WORK_TYPES.find((t) => t.value === formData.workType)?.label}
                      </p>
                    </div>
                    {formData.budgetMin && formData.budgetMax && (
                      <div>
                        <p className="text-neutral-500">Budget Range</p>
                        <p className="font-semibold text-[#cfe0ad]">
                          ₹{parseInt(formData.budgetMin).toLocaleString("en-IN")} - ₹
                          {parseInt(formData.budgetMax).toLocaleString("en-IN")}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-neutral-500">Required Skills</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.specializations.map((spec) => (
                          <span
                            key={spec}
                            className="px-2 py-0.5 xs:py-1 bg-[#cfe0ad]/20 text-[#cfe0ad] rounded-full text-[0.65rem] xs:text-xs"
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
          className="flex items-center justify-between mt-6 xs:mt-8"
        >
          {currentStep > 1 ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm min-h-[44px] border-[#2a2a2a] hover:bg-[#1a1a1a]"
              >
                <ArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
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
                className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm min-h-[44px] bg-[#cfe0ad] text-black hover:bg-[#bfd09d]"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm min-h-[44px] bg-[#cfe0ad] text-black hover:bg-[#bfd09d] shadow-lg disabled:opacity-50"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 xs:w-5 xs:h-5" />
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
