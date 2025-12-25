import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, HardHat, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "user" as "user" | "contractor",
    company: {
      name: "",
    },
    specializations: [] as string[],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSpecializations = [
    "Residential",
    "Commercial",
    "Renovation",
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Painting",
    "Roofing",
    "Flooring",
    "HVAC",
    "Landscaping",
    "General Construction",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "companyName") {
      setFormData(prev => ({
        ...prev,
        company: { name: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const handleRoleChange = (role: "user" | "contractor") => {
    setFormData(prev => ({ ...prev, role }));
    setError(null);
  };

  const handleSpecializationToggle = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Please enter a valid email";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 8) return "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    if (formData.role === "contractor" && formData.specializations.length === 0) {
      return "Please select at least one specialization";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const registrationData: any = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || undefined,
        role: formData.role,
      };

      if (formData.role === "contractor") {
        if (formData.company.name) {
          registrationData.company = { name: formData.company.name };
        }
        if (formData.specializations.length > 0) {
          registrationData.specializations = formData.specializations;
        }
      }

      await register(registrationData);
      toast.success("Registration successful! Welcome to Matters.");
      // Navigation will be handled by AuthContext after successful registration
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err.message || "Registration failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#010101] flex flex-col items-center justify-start xs:justify-center px-4 py-6 xs:p-6 sm:p-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[340px] xs:max-w-sm sm:max-w-xl md:max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-4 xs:mb-6 sm:mb-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-neutral-400 hover:text-white transition-colors mb-3 xs:mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            Back to Login
          </Link>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white mb-1 xs:mb-2">Create Account</h1>
          <p className="text-xs xs:text-sm sm:text-base text-neutral-400">Join Matters - Construction Management Platform</p>
        </div>

        {/* Registration Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-4 xs:space-y-5 sm:space-y-6 bg-neutral-900/30 border border-neutral-800 rounded-xl xs:rounded-2xl p-4 xs:p-5 sm:p-6 md:p-8"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-xs xs:text-sm font-medium text-neutral-300 mb-2 xs:mb-3">
              I am a
            </label>
            <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => handleRoleChange("user")}
                className={`p-3 xs:p-4 rounded-lg xs:rounded-xl border-2 transition-all duration-200 ${
                  formData.role === "user"
                    ? "bg-blue-500/20 border-blue-500/50 text-white"
                    : "bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600"
                }`}
              >
                <div className="flex flex-col items-center gap-1.5 xs:gap-2">
                  <User className="w-5 h-5 xs:w-6 xs:h-6" />
                  <span className="text-sm xs:text-base font-medium">Customer</span>
                  <span className="text-[0.65rem] xs:text-xs text-neutral-500 text-center">Post jobs & hire contractors</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("contractor")}
                className={`p-3 xs:p-4 rounded-lg xs:rounded-xl border-2 transition-all duration-200 ${
                  formData.role === "contractor"
                    ? "bg-amber-500/20 border-amber-500/50 text-white"
                    : "bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600"
                }`}
              >
                <div className="flex flex-col items-center gap-1.5 xs:gap-2">
                  <HardHat className="w-5 h-5 xs:w-6 xs:h-6" />
                  <span className="text-sm xs:text-base font-medium">Contractor</span>
                  <span className="text-[0.65rem] xs:text-xs text-neutral-500 text-center">Find jobs & manage projects</span>
                </div>
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
            <div>
              <label htmlFor="name" className="block text-xs xs:text-sm font-medium text-neutral-300 mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-xs xs:text-sm font-medium text-neutral-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs xs:text-sm font-medium text-neutral-300 mb-1">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors"
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
            <div>
              <label htmlFor="password" className="block text-xs xs:text-sm font-medium text-neutral-300 mb-1">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors pr-11 xs:pr-12"
                  placeholder="Min. 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 xs:right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 xs:w-5 xs:h-5" /> : <Eye className="w-4 h-4 xs:w-5 xs:h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-xs xs:text-sm font-medium text-neutral-300 mb-1">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors pr-11 xs:pr-12"
                  placeholder="Re-enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 xs:right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 xs:w-5 xs:h-5" /> : <Eye className="w-4 h-4 xs:w-5 xs:h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Contractor-specific fields */}
          {formData.role === "contractor" && (
            <div className="space-y-3 xs:space-y-4 pt-3 xs:pt-4 border-t border-neutral-800">
              <h3 className="text-base xs:text-lg font-semibold text-white">Contractor Information</h3>

              <div>
                <label htmlFor="companyName" className="block text-xs xs:text-sm font-medium text-neutral-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.company.name}
                  onChange={handleInputChange}
                  className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 transition-colors"
                  placeholder="Your Company LLC"
                />
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-medium text-neutral-300 mb-2">
                  Specializations <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 xs:gap-2">
                  {availableSpecializations.map(spec => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleSpecializationToggle(spec)}
                      className={`px-2 xs:px-3 py-1.5 xs:py-2 rounded-lg text-[0.7rem] xs:text-xs sm:text-sm transition-all duration-200 ${
                        formData.specializations.includes(spec)
                          ? "bg-[#cfe0ad]/20 border-2 border-[#cfe0ad] text-white"
                          : "bg-neutral-800/50 border-2 border-neutral-700 text-neutral-400 hover:border-neutral-600"
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 xs:py-3 px-4 bg-[#cfe0ad] text-black text-sm xs:text-base font-medium rounded-lg hover:bg-[#bfd09d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 animate-spin" />
                <span className="text-sm xs:text-base">Creating Account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <p className="text-center text-xs xs:text-sm text-neutral-400 pt-1">
            Already have an account?{" "}
            <Link to="/login" className="text-[#cfe0ad] hover:underline">
              Sign in
            </Link>
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
}
