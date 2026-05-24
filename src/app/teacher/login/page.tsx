"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function TeacherLoginPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [teacherId, setTeacherId] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn("teacher", { teacherId, emailOrPhone });
      router.push("/teacher/dashboard");
    } catch {
      setError("Invalid Teacher ID or email/phone");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Teacher Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Maple Diary Education Platform
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>Teacher ID</Label>
              <Input
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                placeholder="TCH-0001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email or Phone Number</Label>
              <Input
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="name@gmail.com or 9876543210"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
