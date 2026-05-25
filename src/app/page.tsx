"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const adminToken = localStorage.getItem("__convexAuthJWT_maple-admin");
    const teacherToken = localStorage.getItem("__convexAuthJWT_maple-teacher");
    const studentToken = localStorage.getItem("__convexAuthJWT_maple-student");

    if (adminToken) {
      router.replace("/dashboard");
    } else if (teacherToken) {
      router.replace("/teacher/dashboard");
    } else if (studentToken) {
      router.replace("/student/dashboard");
    } else {
      router.replace("/sign-in");
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}
