"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { Eye, EyeOff } from "lucide-react";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const resetPassword = useAction(api.teacherAuth.resetPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("expired")) {
        setError("Reset link has expired. Please request a new one.");
      } else if (message.includes("Invalid")) {
        setError("Invalid reset link. Please request a new one.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-destructive">Invalid reset link.</p>
        <Link href="/teacher/forgot-password">
          <Button variant="outline">Request a new link</Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Password reset successfully!
        </p>
        <Link href="/teacher/login">
          <Button className="w-full">Go to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
            autoComplete="new-password"
            className="pr-10"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm"
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            required
            autoComplete="new-password"
            className="pr-10"
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <ResetForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
