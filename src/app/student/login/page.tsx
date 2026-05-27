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
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import Link from "next/link";

function parseError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const match = raw.match(/Uncaught Error:\s*(.+)/);
  return match ? match[1].trim() : raw;
}

type Step = "credentials" | "otp";

export default function StudentLoginPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const requestOtp = useAction(api.otp.requestStudentOtp);

  const [step, setStep] = useState<Step>("credentials");
  const [studentId, setStudentId] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/student/dashboard");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (step === "otp") otpInputRef.current?.focus();
  }, [step]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = studentId.trim();
    const trimmedInput = emailOrPhone.trim();

    if (!trimmedId) { toast.error("Please enter your Student ID."); return; }
    if (!trimmedInput) { toast.error("Please enter your email or phone number."); return; }

    const isEmail = trimmedInput.includes("@");
    if (isEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedInput)) {
        toast.error("Please enter a valid email address."); return;
      }
    } else {
      const digitsOnly = trimmedInput.replace(/\D/g, "");
      if (digitsOnly.length !== 10) {
        toast.error("Please enter a valid 10-digit phone number."); return;
      }
    }

    setLoading(true);
    try {
      const result = await requestOtp({ studentId: trimmedId, emailOrPhone: trimmedInput });
      setMaskedEmail(result.maskedEmail);
      setStep("otp");
      setResendCooldown(60);
      toast.success("Verification code sent to your email.");
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) { toast.error("Please enter the 6-digit verification code."); return; }

    setLoading(true);
    try {
      await signIn("student", { studentId: studentId.trim(), emailOrPhone: emailOrPhone.trim(), otp: trimmedOtp });
      router.push("/student/dashboard");
    } catch (err) {
      const msg = parseError(err);
      if (msg.includes("Failed to fetch") || msg.includes("network")) {
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
      const result = await requestOtp({ studentId: studentId.trim(), emailOrPhone: emailOrPhone.trim() });
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
          <CardTitle className="text-2xl">Student Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Maple Diary Education Platform</p>
        </CardHeader>
        <CardContent>
          {step === "credentials" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="STU-0001" required autoComplete="username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailOrPhone">Email or Phone Number</Label>
                <Input id="emailOrPhone" value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} placeholder="name@gmail.com or 9876543210" required autoComplete="email" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Continue"}
              </Button>
              <div className="text-center">
                <Link href="/student/forgot-id" className="text-sm text-primary hover:underline">Forgot Student ID?</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center text-sm text-muted-foreground mb-2">
                We sent a 6-digit verification code to{" "}
                <span className="font-medium text-foreground">{maskedEmail}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input id="otp" ref={otpInputRef} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest" required autoComplete="one-time-code" inputMode="numeric" />
              </div>
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Sign In"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => { setStep("credentials"); setOtp(""); }} className="text-primary hover:underline">Back</button>
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
