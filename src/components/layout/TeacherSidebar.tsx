"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTeacherAuth } from "@/providers/TeacherAuthProvider";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  LayoutDashboard,
  ClipboardCheck,
  ClipboardList,
  FileDown,
  MessageSquare,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Id } from "../../../convex/_generated/dataModel";

const attendanceItems = [
  { href: "/teacher/attendance/mark", label: "Mark Attendance", icon: ClipboardCheck },
  { href: "/teacher/attendance/history", label: "History", icon: ClipboardList },
  { href: "/teacher/attendance/export", label: "Export PDF", icon: FileDown },
];

export default function TeacherSidebar() {
  const pathname = usePathname();
  const { profile, selectedSubjectId, setSelectedCourseId } = useTeacherAuth();
  const [attendanceOpen, setAttendanceOpen] = useState(
    pathname.startsWith("/teacher/attendance")
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const courses = useQuery(api.subjects.list, {});

  const teacherCourses = courses?.filter((c: any) =>
    profile?.subjectIds.includes(c._id)
  ) ?? [];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold tracking-tight">Maple Diary</h1>
        <p className="text-xs text-muted-foreground mt-1">Teacher Portal</p>
      </div>

      {/* Course Selector */}
      {teacherCourses.length > 0 && (
        <div className="p-4 border-b">
          <Select
            value={selectedSubjectId}
            onValueChange={(v) => v && setSelectedCourseId(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select course">
                {(value: string) => {
                  if (!value) return "Select course";
                  return teacherCourses.find((c: any) => c._id === value)?.name ?? value;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {teacherCourses.map((c: any) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/teacher/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive("/teacher/dashboard")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        <div>
          <button
            onClick={() => setAttendanceOpen(!attendanceOpen)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full",
              pathname.startsWith("/teacher/attendance")
                ? "text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <ClipboardCheck className="h-4 w-4" />
            Attendance
            <ChevronDown
              className={cn(
                "h-4 w-4 ml-auto transition-transform",
                attendanceOpen && "rotate-180"
              )}
            />
          </button>
          {attendanceOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {attendanceItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/teacher/batch-requests"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive("/teacher/batch-requests")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <MessageSquare className="h-4 w-4" />
          Batch Requests
        </Link>
      </nav>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
