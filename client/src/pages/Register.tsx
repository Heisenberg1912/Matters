import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import PhoneShell from '@/components/phone-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2, User, Phone, Sparkles, HardHat, Github } from 'lucide-react';

// Floating orb component for background decoration
const FloatingOrb = ({ delay, size, x, y }: { delay: number; size: number; x: string; y: string }) => (
  <motion.div
    className="absolute rounded-full bg-pill/10 blur-3xl pointer-events-none"
    style={{ width: size, height: size, left: x, top: y }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3],
      x: [0, 20, 0],
      y: [0, -20, 0],
    }}
    transition={{
      duration: 6,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

// Stagger container animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15
    }
  }
};

// Individual item animation
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
};

// Logo animation
const logoVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
      delay: 0.1
    }
  }
};

// Input focus animation
const inputFocusVariants = {
  rest: { scale: 1 },
  focus: { scale: 1.01, transition: { type: "spring" as const, stiffness: 400, damping: 25 } }
};

const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M21.82 10.04H12v3.94h5.62c-.24 1.33-1.55 3.9-5.62 3.9-3.38 0-6.13-2.8-6.13-6.25s2.75-6.25 6.13-6.25c1.93 0 3.23.82 3.97 1.53l2.7-2.6C16.92 2.72 14.63 1.6 12 1.6 6.44 1.6 2 6.15 2 11.63S6.44 21.66 12 21.66c6.97 0 8.68-4.9 8.68-7.3 0-.5-.05-.88-.14-1.32z"
    />
  </svg>
);

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, verifyEmail, signUpWithOAuth, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'contractor',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const redirectTo = (location.state as { from?: string } | undefined)?.from || '/home';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!formData.name || !formData.email || !formData.password) {
      setLocalError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
      });
      if (result.status === 'complete') {
        navigate(redirectTo);
      } else {
        setNeedsVerification(true);
      }
    } catch {
      // Error is handled by context
    }
  };

  const displayError = localError || error;

  const handleSocialSignUp = async (provider: "google" | "github") => {
    setLocalError('');
    clearError();

    try {
      await signUpWithOAuth(provider, { redirectTo, role: formData.role });
    } catch {
      // Error is handled by context
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!verificationCode.trim()) {
      setLocalError('Please enter the verification code');
      return;
    }

    try {
      await verifyEmail(verificationCode.trim());
      navigate(redirectTo);
    } catch {
      // Error is handled by context
    }
  };

  return (
    <PhoneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-background flex flex-col relative overflow-hidden"
      >
        {/* Animated background orbs */}
        <FloatingOrb delay={0} size={180} x="5%" y="10%" />
        <FloatingOrb delay={2} size={140} x="75%" y="5%" />
        <FloatingOrb delay={3} size={160} x="15%" y="50%" />
        <FloatingOrb delay={1.5} size={100} x="85%" y="60%" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-pill/5 via-transparent to-background pointer-events-none" />

        {/* Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex flex-col min-h-screen"
        >
          {/* Header */}
          <div className="pt-8 pb-4 px-6 text-center">
            <motion.div
              variants={logoVariants}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pill to-pill/70 rounded-2xl mb-4 shadow-lg shadow-pill/20 relative"
            >
              {/* Glow ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-pill/30"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <Building2 className="w-8 h-8 text-background relative z-10" />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Create Account
              </h1>
              <p className="text-muted text-sm flex items-center justify-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-pill" />
                Start managing your construction projects
                <Sparkles className="w-3.5 h-3.5 text-pill" />
              </p>
            </motion.div>
          </div>

          {/* Form */}
          <div className="flex-1 px-6 overflow-y-auto pb-4">
            {needsVerification ? (
              <motion.form
                onSubmit={handleVerify}
                className="space-y-4"
                variants={containerVariants}
              >
                <AnimatePresence mode="wait">
                  {displayError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-sm backdrop-blur-sm"
                    >
                      {displayError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div variants={itemVariants} className="space-y-2 text-center">
                  <p className="text-sm text-muted">
                    We sent a verification code to <span className="text-foreground">{formData.email}</span>.
                  </p>
                  <p className="text-xs text-muted">Enter the code below to activate your account.</p>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="verificationCode" className="text-foreground/80 text-sm font-medium pl-1">Verification Code *</Label>
                  <motion.div
                    className="relative"
                    variants={inputFocusVariants}
                    animate={focusedInput === 'verificationCode' ? 'focus' : 'rest'}
                  >
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                      focusedInput === 'verificationCode' ? 'text-pill' : 'text-muted'
                    }`} />
                    <Input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      placeholder="Enter code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      onFocus={() => setFocusedInput('verificationCode')}
                      onBlur={() => setFocusedInput(null)}
                      className="pl-12 h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted/50 focus:border-pill focus:ring-pill/20 transition-all duration-300"
                      disabled={isLoading}
                    />
                  </motion.div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-pill to-pill/80 hover:from-pill/90 hover:to-pill/70 text-background font-semibold shadow-lg shadow-pill/25 transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-3">
                          <motion.span
                            className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Verifying...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Verify Email
                          <motion.span
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <ArrowRight className="w-5 h-5" />
                          </motion.span>
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.form>
            ) : (
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-4"
                variants={containerVariants}
              >
              <AnimatePresence mode="wait">
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-sm backdrop-blur-sm"
                  >
                    {displayError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Role Selection */}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label className="text-foreground/80 text-sm font-medium pl-1">I am a</Label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: 'user' }))}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                      formData.role === 'user'
                        ? 'border-pill bg-pill/10 shadow-lg shadow-pill/10'
                        : 'border-border bg-card hover:border-pill/50'
                    }`}
                  >
                    <Building2 className={`w-6 h-6 mx-auto mb-2 transition-colors duration-300 ${
                      formData.role === 'user' ? 'text-pill' : 'text-muted'
                    }`} />
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      formData.role === 'user' ? 'text-pill' : 'text-muted'
                    }`}>Project Owner</p>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: 'contractor' }))}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                      formData.role === 'contractor'
                        ? 'border-pill bg-pill/10 shadow-lg shadow-pill/10'
                        : 'border-border bg-card hover:border-pill/50'
                    }`}
                  >
                    <HardHat className={`w-6 h-6 mx-auto mb-2 transition-colors duration-300 ${
                      formData.role === 'contractor' ? 'text-pill' : 'text-muted'
                    }`} />
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      formData.role === 'contractor' ? 'text-pill' : 'text-muted'
                    }`}>Contractor</p>
                  </motion.button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-3">
                <motion.button
                  type="button"
                  onClick={() => handleSocialSignUp("google")}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 rounded-2xl border border-border bg-card/60 text-foreground/80 hover:text-foreground hover:border-pill/50 hover:bg-card/80 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <GoogleIcon className="w-5 h-5" />
                  Continue with Google
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => handleSocialSignUp("github")}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 rounded-2xl border border-border bg-card/60 text-foreground/80 hover:text-foreground hover:border-pill/50 hover:bg-card/80 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <Github className="w-5 h-5" />
                  Continue with GitHub
                </motion.button>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.3em] text-muted/70"
              >
                <span className="h-px flex-1 bg-border/60" />
                or
                <span className="h-px flex-1 bg-border/60" />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="name" className="text-foreground/80 text-sm font-medium pl-1">Full Name *</Label>
                <motion.div
                  className="relative"
                  variants={inputFocusVariants}
                  animate={focusedInput === 'name' ? 'focus' : 'rest'}
                >
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    focusedInput === 'name' ? 'text-pill' : 'text-muted'
                  }`} />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-12 h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted/50 focus:border-pill focus:ring-pill/20 transition-all duration-300"
                    disabled={isLoading}
                  />
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80 text-sm font-medium pl-1">Email *</Label>
                <motion.div
                  className="relative"
                  variants={inputFocusVariants}
                  animate={focusedInput === 'email' ? 'focus' : 'rest'}
                >
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    focusedInput === 'email' ? 'text-pill' : 'text-muted'
                  }`} />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-12 h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted/50 focus:border-pill focus:ring-pill/20 transition-all duration-300"
                    disabled={isLoading}
                  />
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="phone" className="text-foreground/80 text-sm font-medium pl-1">Phone Number</Label>
                <motion.div
                  className="relative"
                  variants={inputFocusVariants}
                  animate={focusedInput === 'phone' ? 'focus' : 'rest'}
                >
                  <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    focusedInput === 'phone' ? 'text-pill' : 'text-muted'
                  }`} />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-12 h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted/50 focus:border-pill focus:ring-pill/20 transition-all duration-300"
                    disabled={isLoading}
                  />
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80 text-sm font-medium pl-1">Password *</Label>
                <motion.div
                  className="relative"
                  variants={inputFocusVariants}
                  animate={focusedInput === 'password' ? 'focus' : 'rest'}
                >
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    focusedInput === 'password' ? 'text-pill' : 'text-muted'
                  }`} />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-12 pr-12 h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted/50 focus:border-pill focus:ring-pill/20 transition-all duration-300"
                    disabled={isLoading}
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-pill transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </motion.button>
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground/80 text-sm font-medium pl-1">Confirm Password *</Label>
                <motion.div
                  className="relative"
                  variants={inputFocusVariants}
                  animate={focusedInput === 'confirmPassword' ? 'focus' : 'rest'}
                >
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    focusedInput === 'confirmPassword' ? 'text-pill' : 'text-muted'
                  }`} />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-12 h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted/50 focus:border-pill focus:ring-pill/20 transition-all duration-300"
                    disabled={isLoading}
                  />
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-pill to-pill/80 hover:from-pill/90 hover:to-pill/70 text-background font-semibold shadow-lg shadow-pill/25 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-3">
                        <motion.span
                          className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Creating account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Create Account
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.span>
                      </span>
                    )}
                  </Button>
                </motion.div>
              </motion.div>

              <motion.p
                variants={itemVariants}
                className="text-xs text-muted text-center pt-2"
              >
                By signing up, you agree to our{' '}
                <Link to="/privacy-policy" className="text-pill hover:text-pill/80 transition-colors duration-300">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/terms" className="text-pill hover:text-pill/80 transition-colors duration-300">
                  Terms of Service
                </Link>
              </motion.p>
              </motion.form>
            )}
          </div>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="px-6 py-4 text-center"
          >
            <p className="text-muted">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-pill font-semibold hover:text-pill/80 transition-colors duration-300 relative group"
              >
                Sign In
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pill group-hover:w-full transition-all duration-300" />
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </PhoneShell>
  );
}
