import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, HardHat, Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock, Phone, Building, Check, ArrowRight } from "lucide-react";
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err.message || "Registration failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({
    id,
    name,
    type = "text",
    label,
    placeholder,
    value,
    required = false,
    icon: Icon,
    showPasswordToggle = false,
    isPasswordVisible = false,
    onPasswordToggle,
  }: {
    id: string;
    name: string;
    type?: string;
    label: string;
    placeholder: string;
    value: string;
    required?: boolean;
    icon: React.ElementType;
    showPasswordToggle?: boolean;
    isPasswordVisible?: boolean;
    onPasswordToggle?: () => void;
  }) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs xs:text-sm font-medium text-neutral-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <motion.div
        className="relative"
        animate={{ scale: focusedField === id ? 1.01 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute left-3.5 xs:left-4 top-1/2 -translate-y-1/2 text-neutral-500">
          <Icon className="w-4 h-4 xs:w-5 xs:h-5" />
        </div>
        <input
          type={showPasswordToggle ? (isPasswordVisible ? "text" : "password") : type}
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setFocusedField(id)}
          onBlur={() => setFocusedField(null)}
          className={`w-full pl-10 xs:pl-12 ${showPasswordToggle ? "pr-12" : "pr-4"} py-3 xs:py-3.5 bg-neutral-900/80 border border-neutral-700/50 rounded-xl text-sm xs:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-[#cfe0ad]/50 focus:ring-2 focus:ring-[#cfe0ad]/20 transition-all duration-200`}
          placeholder={placeholder}
          required={required}
        />
        {showPasswordToggle && onPasswordToggle && (
          <button
            type="button"
            onClick={onPasswordToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-neutral-800/50"
          >
            {isPasswordVisible ? (
              <EyeOff className="w-4 h-4 xs:w-5 xs:h-5" />
            ) : (
              <Eye className="w-4 h-4 xs:w-5 xs:h-5" />
            )}
          </button>
        )}
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#010101] flex flex-col items-center justify-start px-4 py-6 xs:py-8 overflow-y-auto relative">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(207, 224, 173, 0.06) 0%, transparent 70%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        <motion.div
          className="absolute -bottom-[20%] -left-[20%] w-[60%] h-[60%] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(207, 224, 173, 0.04) 0%, transparent 70%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[360px] xs:max-w-[400px] sm:max-w-xl md:max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-5 xs:mb-6 sm:mb-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-neutral-400 hover:text-[#cfe0ad] transition-colors mb-4 xs:mb-5 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
          <motion.h1
            className="text-2xl xs:text-3xl sm:text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Create Account
          </motion.h1>
          <motion.p
            className="text-xs xs:text-sm sm:text-base text-neutral-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Join Matters - Construction Management Platform
          </motion.p>
        </div>

        {/* Registration Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-5 xs:space-y-6 bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/60 rounded-2xl xs:rounded-3xl p-5 xs:p-6 sm:p-8 shadow-2xl shadow-black/40"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 rounded-2xl xs:rounded-3xl bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="p-3 xs:p-4 rounded-xl bg-red-500/10 border border-red-500/20 overflow-hidden"
              >
                <p className="text-red-400 text-xs xs:text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Role Selection */}
          <div className="relative">
            <label className="block text-xs xs:text-sm font-medium text-neutral-300 mb-3">
              I am a
            </label>
            <div className="grid grid-cols-2 gap-3 xs:gap-4">
              <motion.button
                type="button"
                onClick={() => handleRoleChange("user")}
                className={`relative p-4 xs:p-5 rounded-xl xs:rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                  formData.role === "user"
                    ? "bg-[#cfe0ad]/10 border-[#cfe0ad]/50 text-white"
                    : "bg-neutral-800/30 border-neutral-700/50 text-neutral-400 hover:border-neutral-600"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {formData.role === "user" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-[#cfe0ad]/10 to-transparent"
                    layoutId="roleHighlight"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative flex flex-col items-center gap-2 xs:gap-3">
                  <div className={`p-2.5 xs:p-3 rounded-xl ${formData.role === "user" ? "bg-[#cfe0ad]/20" : "bg-neutral-700/50"}`}>
                    <User className={`w-5 h-5 xs:w-6 xs:h-6 ${formData.role === "user" ? "text-[#cfe0ad]" : ""}`} />
                  </div>
                  <span className="text-sm xs:text-base font-semibold">Customer</span>
                  <span className="text-[0.65rem] xs:text-xs text-neutral-500 text-center leading-tight">
                    Post jobs & hire contractors
                  </span>
                </div>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => handleRoleChange("contractor")}
                className={`relative p-4 xs:p-5 rounded-xl xs:rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                  formData.role === "contractor"
                    ? "bg-amber-500/10 border-amber-500/50 text-white"
                    : "bg-neutral-800/30 border-neutral-700/50 text-neutral-400 hover:border-neutral-600"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {formData.role === "contractor" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"
                    layoutId="roleHighlight"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative flex flex-col items-center gap-2 xs:gap-3">
                  <div className={`p-2.5 xs:p-3 rounded-xl ${formData.role === "contractor" ? "bg-amber-500/20" : "bg-neutral-700/50"}`}>
                    <HardHat className={`w-5 h-5 xs:w-6 xs:h-6 ${formData.role === "contractor" ? "text-amber-500" : ""}`} />
                  </div>
                  <span className="text-sm xs:text-base font-semibold">Contractor</span>
                  <span className="text-[0.65rem] xs:text-xs text-neutral-500 text-center leading-tight">
                    Find jobs & manage projects
                  </span>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              id="name"
              name="name"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              required
              icon={User}
            />
            <InputField
              id="phone"
              name="phone"
              type="tel"
              label="Phone Number"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              icon={Phone}
            />
          </div>

          <InputField
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="john@example.com"
            value={formData.email}
            required
            icon={Mail}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              id="password"
              name="password"
              label="Password"
              placeholder="Min. 8 characters"
              value={formData.password}
              required
              icon={Lock}
              showPasswordToggle
              isPasswordVisible={showPassword}
              onPasswordToggle={() => setShowPassword(!showPassword)}
            />
            <InputField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              required
              icon={Lock}
              showPasswordToggle
              isPasswordVisible={showConfirmPassword}
              onPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </div>

          {/* Contractor-specific fields */}
          <AnimatePresence>
            {formData.role === "contractor" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pt-4 border-t border-neutral-800">
                  <h3 className="text-base xs:text-lg font-semibold text-white flex items-center gap-2">
                    <HardHat className="w-5 h-5 text-amber-500" />
                    Contractor Information
                  </h3>

                  <InputField
                    id="companyName"
                    name="companyName"
                    label="Company Name"
                    placeholder="Your Company LLC"
                    value={formData.company.name}
                    icon={Building}
                  />

                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-neutral-300 mb-3">
                      Specializations <span className="text-red-400">*</span>
                      <span className="text-neutral-500 font-normal ml-2">
                        ({formData.specializations.length} selected)
                      </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableSpecializations.map(spec => (
                        <motion.button
                          key={spec}
                          type="button"
                          onClick={() => handleSpecializationToggle(spec)}
                          className={`relative px-3 py-2.5 rounded-xl text-xs xs:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            formData.specializations.includes(spec)
                              ? "bg-[#cfe0ad]/15 border-2 border-[#cfe0ad]/60 text-[#cfe0ad]"
                              : "bg-neutral-800/50 border-2 border-neutral-700/50 text-neutral-400 hover:border-neutral-600"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {formData.specializations.includes(spec) && (
                            <Check className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
                          )}
                          <span className="truncate">{spec}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            className="relative w-full py-3.5 xs:py-4 px-4 bg-gradient-to-r from-[#cfe0ad] to-[#bdd49b] text-[#010101] text-sm xs:text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px] xs:min-h-[56px] overflow-hidden group shadow-lg shadow-[#cfe0ad]/20"
            whileHover={{ scale: isLoading ? 1 : 1.01 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            {/* Button shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
              animate={!isLoading ? { translateX: ["100%", "-100%"] } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
              }}
            />

            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>

          {/* Login link */}
          <p className="text-center text-xs xs:text-sm text-neutral-400 pt-2">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#cfe0ad] hover:text-[#bfd09d] font-medium transition-colors inline-flex items-center gap-1 group"
            >
              Sign in
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </p>
        </motion.form>
      </motion.div>

      {/* Bottom safe area */}
      <div className="h-safe-area-inset-bottom" />
    </div>
  );
}
