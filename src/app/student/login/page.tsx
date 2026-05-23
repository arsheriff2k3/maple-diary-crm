"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function StudentLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, studentId }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      sessionStorage.setItem(
        "maple_student_profile",
        JSON.stringify(data.student)
      );
      router.push("/student/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Student Login</CardTitle>
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
              <Label>Phone Number</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Student ID</Label>
              <Input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="STU-0001"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center">
              <Link
                href="/student/forgot-id"
                className="text-sm text-primary hover:underline"
              >
                Forgot Student ID?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
