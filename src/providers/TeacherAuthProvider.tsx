"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";

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
  profile: TeacherProfile | null;
  selectedSubjectId: string;
  setSelectedCourseId: (id: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const TeacherAuthContext = createContext<TeacherAuthContextType>({
  staffId: null,
  profile: null,
  selectedSubjectId: "",
  setSelectedCourseId: () => {},
  logout: async () => {},
  loading: true,
});

export function useTeacherAuth() {
  return useContext(TeacherAuthContext);
}

export default function TeacherAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [selectedSubjectId, setSelectedCourseId] = useState("");

  // Fetch current user to get staffId
  const currentUser = useQuery(api.users.currentUser);

  // Fetch staff profile once we have staffId
  const staffProfile = useQuery(
    api.staff.getById,
    currentUser?.staffId ? { id: currentUser.staffId } : "skip"
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/teacher/login");
      return;
    }
    // Redirect if authenticated but not a teacher
    if (currentUser && currentUser.role !== "teacher") {
      router.push("/teacher/login");
    }
  }, [isLoading, isAuthenticated, currentUser, router]);

  // Set default subject
  useEffect(() => {
    if (staffProfile && staffProfile.subjectIds.length > 0 && !selectedSubjectId) {
      setSelectedCourseId(staffProfile.subjectIds[0]);
    }
  }, [staffProfile, selectedSubjectId]);

  const profile: TeacherProfile | null = staffProfile
    ? {
        _id: staffProfile._id,
        firstName: staffProfile.firstName,
        lastName: staffProfile.lastName,
        email: staffProfile.email,
        subjectIds: staffProfile.subjectIds,
        departmentId: staffProfile.departmentId,
        timezone: staffProfile.timezone,
      }
    : null;

  const logout = useCallback(async () => {
    await signOut();
    router.push("/teacher/login");
  }, [signOut, router]);

  const loading = isLoading || (isAuthenticated && !staffProfile);

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
    <TeacherAuthContext.Provider
      value={{
        staffId: currentUser?.staffId ?? null,
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
