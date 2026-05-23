"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const res = await fetch("/api/auth/teacher/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Reset failed");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong");
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
        <Label>New Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Confirm Password</Label>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          required
        />
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
