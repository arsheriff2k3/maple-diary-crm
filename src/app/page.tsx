"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Check localStorage for existing auth tokens to redirect to the right portal
    // The actual token validity is checked by each portal's auth guard
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
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
