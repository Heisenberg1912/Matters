import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneShell from "@/components/phone-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError("");
    clearError();

    if (!email) {
      setLocalError("Please enter your email address");
      return;
    }

    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      // handled by context
    }
  };

  const displayError = localError || error;

  return (
    <PhoneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col"
      >
        <div className="pt-12 pb-8 px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-2">
            We'll send you a secure link to reset your password.
          </p>
        </div>

        <div className="flex-1 px-6">
          {sent ? (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-4 rounded-xl text-sm">
                Password reset code sent. Check your inbox and enter the code to set a new password.
              </div>
              <Button
                type="button"
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
                asChild
              >
                <Link to="/reset-password">Continue to Reset</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {displayError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {displayError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Send Reset Link
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>
          )}
        </div>

        <div className="px-6 py-6 text-center text-sm text-gray-600">
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </PhoneShell>
  );
}
