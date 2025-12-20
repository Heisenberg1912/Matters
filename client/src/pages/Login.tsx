import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import PhoneShell from '@/components/phone-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { guestSession } from '@/lib/guest-session';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2, Loader2, LogOut } from 'lucide-react';

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
        className="min-h-screen bg-background flex flex-col"
      >
        {/* Header */}
        <div className="pt-12 pb-8 px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pill to-pill/70 rounded-2xl mb-5 shadow-lg shadow-pill/20">
            <Building2 className="w-8 h-8 text-background" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAuthenticated ? 'Switch Account' : 'Welcome Back'}
          </h1>
          <p className="text-muted mt-1">
            {isAuthenticated ? 'Sign in with a different account' : 'Sign in to manage your projects'}
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 px-6">
          {/* Already signed in banner */}
          {isAuthenticated && (
            <div className="mb-4 p-4 rounded-xl bg-card border border-border">
              <p className="text-sm text-muted mb-3">
                Signed in as <span className="text-foreground font-medium">{user?.email}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/home')}
                  className="flex-1"
                >
                  Go to Home
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={isBusy}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Display */}
            {displayError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {displayError}
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialSignIn("google")}
                disabled={isBusy}
                className="w-full h-12 rounded-xl border-border bg-card/60 hover:bg-card/80 hover:border-pill/50"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialSignIn("github")}
                disabled={isBusy}
                className="w-full h-12 rounded-xl border-border bg-card/60 hover:bg-card/80 hover:border-pill/50"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" aria-hidden="true">
                  <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Continue with GitHub
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted/70 py-2">
              <span className="h-px flex-1 bg-border/60" />
              or
              <span className="h-px flex-1 bg-border/60" />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80 text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-card border-border focus:border-pill"
                  disabled={isBusy}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80 text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 rounded-xl bg-card border-border focus:border-pill"
                  disabled={isBusy}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-pill hover:text-pill/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isBusy}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-pill to-pill/80 hover:from-pill/90 hover:to-pill/70 text-background font-semibold shadow-lg shadow-pill/25"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isAuthenticated ? 'Switch Account' : 'Sign In'}
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          {/* Demo Mode - only show when not authenticated */}
          {!isAuthenticated && (
            <Button
              type="button"
              variant="ghost"
              className="w-full h-11 rounded-xl mt-3 text-muted hover:text-foreground hover:bg-card/50"
              onClick={handleGuestContinue}
              disabled={isBusy}
            >
              Continue as Guest (Demo Mode)
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-8 text-center">
          <p className="text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-pill font-semibold hover:text-pill/80 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </PhoneShell>
  );
}
