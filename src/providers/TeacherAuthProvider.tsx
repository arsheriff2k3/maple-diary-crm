"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";

interface TeacherProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  subjectIds: string[];
  departmentId: string;
  timezone?: string;
}

interface TeacherAuthContextType {
  staffId: string | null;
  token: string | null;
  profile: TeacherProfile | null;
  selectedSubjectId: string;
  setSelectedCourseId: (id: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const TeacherAuthContext = createContext<TeacherAuthContextType>({
  staffId: null,
  token: null,
  profile: null,
  selectedSubjectId: "",
  setSelectedCourseId: () => {},
  logout: async () => {},
  loading: true,
});

export function useTeacherAuth() {
  return useContext(TeacherAuthContext);
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

export default function TeacherAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [selectedSubjectId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cookieToken = getCookie("maple_teacher_token");
    if (!cookieToken) {
      setLoading(false);
      router.push("/teacher/login");
      return;
    }

    const payload = parseJWT(cookieToken);
    if (!payload || payload.role !== "teacher") {
      setLoading(false);
      router.push("/teacher/login");
      return;
    }

    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      setLoading(false);
      router.push("/teacher/login");
      return;
    }

    setToken(cookieToken);

    // Profile is stored after login - read from sessionStorage
    const cached = sessionStorage.getItem("maple_teacher_profile");
    if (cached) {
      const p = JSON.parse(cached) as TeacherProfile;
      setProfile(p);
      if (p.subjectIds.length > 0 && !selectedSubjectId) {
        setSelectedCourseId(p.subjectIds[0]);
      }
    }

    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/teacher/logout", { method: "POST" });
    sessionStorage.removeItem("maple_teacher_profile");
    setToken(null);
    setProfile(null);
    router.push("/teacher/login");
  }, [router]);

  const staffId = profile?._id ?? null;

  return (
    <TeacherAuthContext.Provider
      value={{
        staffId,
        token,
        profile,
        selectedSubjectId,
        setSelectedCourseId,
        logout,
        loading,
      }}
    >
      {children}
    </TeacherAuthContext.Provider>
  );
}
