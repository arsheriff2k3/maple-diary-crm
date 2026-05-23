"use client";

import { useStudentAuth } from "@/providers/StudentAuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function StudentHeader() {
  const { profile, logout } = useStudentAuth();

  return (
    <header className="h-14 border-b flex items-center justify-end px-6 gap-4">
      {profile && (
        <span className="text-sm text-muted-foreground">
          {profile.firstName} {profile.lastName} ({profile.studentId})
        </span>
      )}
      <Button variant="ghost" size="sm" onClick={logout}>
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </header>
  );
}
