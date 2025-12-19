import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import PhoneShell from '@/components/phone-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2, Sparkles } from 'lucide-react';

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
      staggerChildren: 0.1,
      delayChildren: 0.2
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
  focus: { scale: 1.02, transition: { type: "spring" as const, stiffness: 400, damping: 25 } }
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      const redirectTo = (location.state as { from?: string } | undefined)?.from || '/home';
      navigate(redirectTo);
    } catch {
      // Error is handled by context
    }
  };

  const displayError = localError || error;

  return (
    <PhoneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-background flex flex-col relative overflow-hidden"
      >
        {/* Animated background orbs */}
        <FloatingOrb delay={0} size={200} x="10%" y="5%" />
        <FloatingOrb delay={2} size={150} x="70%" y="15%" />
        <FloatingOrb delay={4} size={180} x="20%" y="60%" />
        <FloatingOrb delay={1} size={120} x="80%" y="70%" />

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
          <div className="pt-12 pb-8 px-6 text-center">
            <motion.div
              variants={logoVariants}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pill to-pill/70 rounded-3xl mb-6 shadow-lg shadow-pill/20 relative"
            >
              {/* Glow ring */}
              <motion.div
                className="absolute inset-0 rounded-3xl bg-pill/30"
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
              <Building2 className="w-10 h-10 text-background relative z-10" />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Welcome Back
              </h1>
              <p className="text-muted flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-pill" />
                Sign in to manage your projects
                <Sparkles className="w-4 h-4 text-pill" />
              </p>
            </motion.div>
          </div>

          {/* Form */}
          <div className="flex-1 px-6">
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5"
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

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80 text-sm font-medium pl-1">
                  Email
                </Label>
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
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-12 h-14 rounded-2xl bg-card border-border text-foreground placeholder:text-muted/50 focus:border-pill focus:ring-pill/20 transition-all duration-300"
                    disabled={isLoading}
                  />
                  {focusedInput === 'email' && (
                    <motion.div
                      layoutId="input-glow"
                      className="absolute inset-0 rounded-2xl border-2 border-pill/50 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80 text-sm font-medium pl-1">
                  Password
                </Label>
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-12 pr-12 h-14 rounded-2xl bg-card border-border text-foreground placeholder:text-muted/50 focus:border-pill focus:ring-pill/20 transition-all duration-300"
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
                  {focusedInput === 'password' && (
                    <motion.div
                      layoutId="input-glow"
                      className="absolute inset-0 rounded-2xl border-2 border-pill/50 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-pill hover:text-pill/80 transition-colors duration-300"
                >
                  Forgot password?
                </Link>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-pill to-pill/80 hover:from-pill/90 hover:to-pill/70 text-background font-semibold text-base shadow-lg shadow-pill/25 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-3">
                        <motion.span
                          className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign In
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

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-4 my-6"
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <span className="text-sm text-muted px-2">or continue with</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </motion.div>

            {/* Google Sign-In */}
            <motion.div variants={itemVariants}>
              <GoogleSignInButton
                onSuccess={() => {
                  const redirectTo = (location.state as { from?: string } | undefined)?.from || '/home';
                  navigate(redirectTo);
                }}
                onError={(message) => setLocalError(message)}
              />
            </motion.div>

            {/* Skip for Demo */}
            <motion.div variants={itemVariants}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-12 rounded-2xl mt-3 text-muted hover:text-foreground hover:bg-card/50 border border-transparent hover:border-border transition-all duration-300"
                  onClick={() => navigate('/home')}
                >
                  Continue as Guest (Demo Mode)
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="px-6 py-8 text-center"
          >
            <p className="text-muted">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-pill font-semibold hover:text-pill/80 transition-colors duration-300 relative group"
              >
                Sign Up
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pill group-hover:w-full transition-all duration-300" />
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </PhoneShell>
  );
}
