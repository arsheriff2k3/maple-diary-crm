"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";

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
  profile: StudentProfile | null;
  logout: () => Promise<void>;
  loading: boolean;
}

const StudentAuthContext = createContext<StudentAuthContextType>({
  studentDocId: null,
  profile: null,
  logout: async () => {},
  loading: true,
});

export function useStudentAuth() {
  return useContext(StudentAuthContext);
}

export default function StudentAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();

  const currentUser = useQuery(api.users.currentUser);

  const studentProfile = useQuery(
    api.students.getById,
    currentUser?.studentDocId ? { id: currentUser.studentDocId } : "skip"
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/student/login");
      return;
    }
    if (currentUser && currentUser.role !== "student") {
      router.push("/student/login");
    }
  }, [isLoading, isAuthenticated, currentUser, router]);

  const profile: StudentProfile | null = studentProfile
    ? {
        _id: studentProfile._id,
        firstName: studentProfile.firstName,
        lastName: studentProfile.lastName,
        studentId: studentProfile.studentId ?? "",
        subjectIds: studentProfile.subjectIds,
        region: studentProfile.region,
        timezone: studentProfile.timezone,
      }
    : null;

  const logout = useCallback(async () => {
    await signOut();
    router.push("/student/login");
  }, [signOut, router]);

  const loading = isLoading || (isAuthenticated && !studentProfile);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <StudentAuthContext.Provider
      value={{
        studentDocId: currentUser?.studentDocId ?? null,
        profile,
        logout,
        loading,
      }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
}
