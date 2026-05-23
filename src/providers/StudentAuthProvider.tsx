"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";

interface StudentProfile {
  _id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  subjectIds: string[];
  region: string;
  timezone: string;
}

interface StudentAuthContextType {
  studentDocId: string | null;
  token: string | null;
  profile: StudentProfile | null;
  logout: () => Promise<void>;
  loading: boolean;
}

const StudentAuthContext = createContext<StudentAuthContextType>({
  studentDocId: null,
  token: null,
  profile: null,
  logout: async () => {},
  loading: true,
});

export function useStudentAuth() {
  return useContext(StudentAuthContext);
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function parseJWT(token: string): any {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function StudentAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cookieToken = getCookie("maple_student_token");
    if (!cookieToken) {
      setLoading(false);
      router.push("/student/login");
      return;
    }

    const payload = parseJWT(cookieToken);
    if (!payload || payload.role !== "student") {
      setLoading(false);
      router.push("/student/login");
      return;
    }

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      setLoading(false);
      router.push("/student/login");
      return;
    }

    setToken(cookieToken);

    const cached = sessionStorage.getItem("maple_student_profile");
    if (cached) {
      setProfile(JSON.parse(cached));
    }

    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/student/logout", { method: "POST" });
    sessionStorage.removeItem("maple_student_profile");
    setToken(null);
    setProfile(null);
    router.push("/student/login");
  }, [router]);

  return (
    <StudentAuthContext.Provider
      value={{
        studentDocId: profile?._id ?? null,
        token,
        profile,
        logout,
        loading,
      }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
}
