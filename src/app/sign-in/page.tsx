"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { useAction } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

function parseError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  // Convex wraps errors: "Uncaught Error: actual message"
  const match = raw.match(/Uncaught Error:\s*(.+)/);
  return match ? match[1].trim() : raw;
}

type Mode = "signIn" | "signUp";
type SignUpStep = "form" | "otp";

export default function AdminSignInPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const requestSignUpOtp = useAction(api.otp.requestAdminSignUpOtp);
  const completeSignUp = useAction(api.otp.completeAdminSignUp);

  const [mode, setMode] = useState<Mode>("signIn");
  const [signUpStep, setSignUpStep] = useState<SignUpStep>("form");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (signUpStep === "otp") otpInputRef.current?.focus();
  }, [signUpStep]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error("Please enter a valid email address."); return; }
    if (!password) { toast.error("Please enter your password."); return; }

    setLoading(true);
    try {
      await signIn("admin", { email: email.trim().toLowerCase(), password });
      router.push("/dashboard");
    } catch (err) {
      const msg = parseError(err);
      if (msg.includes("Failed to fetch") || msg.includes("network")) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSignUpOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Please enter your full name."); return; }
    if (!email.trim()) { toast.error("Please enter your email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error("Please enter a valid email address."); return; }
    if (!password || password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }

    setLoading(true);
    try {
      const result = await requestSignUpOtp({ email: email.trim(), name: name.trim() });
      setMaskedEmail(result.maskedEmail);
      setSignUpStep("otp");
      setResendCooldown(60);
      toast.success("Verification code sent to your email.");
    } catch (err) {
      const msg = parseError(err);
      if (msg.includes("Failed to fetch")) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignUpOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) { toast.error("Please enter the 6-digit code."); return; }

    setLoading(true);
    try {
      await completeSignUp({ email: email.trim(), password, name: name.trim(), otp: trimmedOtp });
      await signIn("admin", { email: email.trim().toLowerCase(), password });
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err) {
      const msg = parseError(err);
      if (msg.includes("Failed to fetch")) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(msg);
      }
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const result = await requestSignUpOtp({ email: email.trim(), name: name.trim() });
      setMaskedEmail(result.maskedEmail);
      setResendCooldown(60);
      setOtp("");
      toast.success("New verification code sent.");
    } catch {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setSignUpStep("form");
    setOtp("");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {mode === "signIn" ? "Admin Login" : "Create Admin Account"}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Maple Diary Education Platform</p>
        </CardHeader>
        <CardContent>
          {mode === "signIn" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => switchMode("signUp")} className="text-sm text-primary hover:underline">
                  First time? Create Admin Account
                </button>
              </div>
            </form>
          )}

          {mode === "signUp" && signUpStep === "form" && (
            <form onSubmit={handleRequestSignUpOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input id="signup-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required autoComplete="new-password" className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required autoComplete="new-password" className="pr-10" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending verification code..." : "Continue"}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => switchMode("signIn")} className="text-sm text-primary hover:underline">
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          )}

          {mode === "signUp" && signUpStep === "otp" && (
            <form onSubmit={handleVerifySignUpOtp} className="space-y-4">
              <div className="text-center text-sm text-muted-foreground mb-2">
                We sent a 6-digit verification code to{" "}
                <span className="font-medium text-foreground">{maskedEmail}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input id="otp" ref={otpInputRef} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest" required autoComplete="one-time-code" inputMode="numeric" />
              </div>
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => { setSignUpStep("form"); setOtp(""); }} className="text-primary hover:underline">Back</button>
                <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0 || loading} className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline">
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
