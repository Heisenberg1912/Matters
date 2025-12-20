import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import PhoneShell from '@/components/phone-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { guestSession } from '@/lib/guest-session';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2, Loader2, LogOut, Sparkles } from 'lucide-react';

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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signInWithOAuth, logout, isAuthenticated, isClerkSignedIn, user, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const redirectTo = (location.state as { from?: string } | undefined)?.from || '/home';

  const displayError = localError || error;
  const isBusy = isLoading || isOAuthLoading || isLoggingOut;

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your email');
      return;
    }

    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    try {
      // Sign out first if already authenticated
      if (isClerkSignedIn) {
        await logout();
      }
      await login(email.trim(), password);
      guestSession.disable();
      navigate(redirectTo);
    } catch {
      // Error is set by AuthContext
    }
  };

  const handleSocialSignIn = async (provider: "google" | "github") => {
    setLocalError('');
    clearError();

    // If already authenticated, sign out first and reload the page
    // This ensures Clerk is fully reset before attempting OAuth
    if (isClerkSignedIn) {
      setIsLoggingOut(true);
      try {
        await logout();
        // Reload the page to fully reset Clerk state
        window.location.reload();
        return;
      } catch {
        setIsLoggingOut(false);
      }
    }

    setIsOAuthLoading(true);
    try {
      await signInWithOAuth(provider, redirectTo);
      // OAuth redirects away, so we don't need to handle success here
    } catch {
      setIsOAuthLoading(false);
      // Error is set by AuthContext
    }
  };

  const handleGuestContinue = async () => {
    setLocalError('');
    clearError();

    if (isClerkSignedIn) {
      setIsLoggingOut(true);
      try {
        await logout();
      } finally {
        setIsLoggingOut(false);
      }
    }

    guestSession.enable();
    navigate('/home');
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
        <FloatingOrb delay={0} size={180} x="10%" y="15%" />
        <FloatingOrb delay={2} size={140} x="80%" y="10%" />
        <FloatingOrb delay={3} size={160} x="5%" y="70%" />
        <FloatingOrb delay={1.5} size={120} x="85%" y="65%" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-pill/5 via-transparent to-background pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Header */}
          <div className="pt-12 pb-8 px-6 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1
              }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pill to-pill/70 rounded-2xl mb-5 shadow-lg shadow-pill/20 relative"
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-1"
            >
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {isAuthenticated ? 'Switch Account' : 'Welcome Back'}
              </h1>
              <p className="text-muted text-sm flex items-center justify-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-pill" />
                {isAuthenticated ? 'Sign in with a different account' : 'Sign in to manage your projects'}
                <Sparkles className="w-3.5 h-3.5 text-pill" />
              </p>
            </motion.div>
          </div>

          {/* Form */}
          <div className="flex-1 px-6 overflow-y-auto pb-4">
            {/* Already signed in banner */}
            <AnimatePresence>
              {isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-4 p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border shadow-lg"
                >
                  <p className="text-sm text-muted mb-3">
                    Signed in as <span className="text-foreground font-medium">{user?.email}</span>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/home')}
                      className="flex-1 rounded-xl"
                    >
                      Go to Home
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      disabled={isBusy}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Sign Out
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Error Display */}
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

              {/* OAuth Buttons */}
              <div className="space-y-3">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialSignIn("google")}
                    disabled={isBusy}
                    className="w-full h-12 rounded-2xl border-border bg-card/60 hover:bg-card/80 hover:border-pill/50 transition-all duration-300"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" aria-hidden="true">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialSignIn("github")}
                    disabled={isBusy}
                    className="w-full h-12 rounded-2xl border-border bg-card/60 hover:bg-card/80 hover:border-pill/50 transition-all duration-300"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" aria-hidden="true">
                      <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    Continue with GitHub
                  </Button>
                </motion.div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.3em] text-muted/70 py-2">
                <span className="h-px flex-1 bg-border/60" />
                or
                <span className="h-px flex-1 bg-border/60" />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80 text-sm font-medium pl-1">
                  Email
                </Label>
                <motion.div
                  className="relative"
                  animate={focusedInput === 'email' ? { scale: 1.01 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
                    className="pl-12 h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted/50 focus:border-pill focus:ring-pill/20 transition-all duration-300"
                    disabled={isBusy}
                    autoComplete="email"
                  />
                </motion.div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80 text-sm font-medium pl-1">
                  Password
                </Label>
                <motion.div
                  className="relative"
                  animate={focusedInput === 'password' ? { scale: 1.01 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
                    className="pl-12 pr-12 h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted/50 focus:border-pill focus:ring-pill/20 transition-all duration-300"
                    disabled={isBusy}
                    autoComplete="current-password"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-pill transition-colors duration-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </motion.button>
                </motion.div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-pill hover:text-pill/80 transition-colors duration-300"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isBusy}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-pill to-pill/80 hover:from-pill/90 hover:to-pill/70 text-background font-semibold shadow-lg shadow-pill/25 transition-all duration-300"
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
                      {isAuthenticated ? 'Switch Account' : 'Sign In'}
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
            </motion.form>

            {/* Demo Mode - only show when not authenticated */}
            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-11 rounded-2xl mt-3 text-muted hover:text-foreground hover:bg-card/50 transition-all duration-300"
                  onClick={handleGuestContinue}
                  disabled={isBusy}
                >
                  Continue as Guest (Demo Mode)
                </Button>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
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
        </div>
      </motion.div>
    </PhoneShell>
  );
}
