"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  CalendarDays,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const managementItems = [
  { href: "/management/departments", label: "Departments", icon: Building2 },
  { href: "/management/courses", label: "Courses", icon: BookOpen },
  { href: "/management/staff", label: "Staff", icon: Users },
  { href: "/management/students", label: "Students", icon: GraduationCap },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [managementOpen, setManagementOpen] = useState(
    pathname.startsWith("/management")
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold tracking-tight">Maple Diary</h1>
        <p className="text-xs text-muted-foreground mt-1">Education Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive("/dashboard")
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
            onClick={() => setManagementOpen(!managementOpen)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full",
              pathname.startsWith("/management")
                ? "text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Building2 className="h-4 w-4" />
            Management
            <ChevronDown
              className={cn(
                "h-4 w-4 ml-auto transition-transform",
                managementOpen && "rotate-180"
              )}
            />
          </button>
          {managementOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {managementItems.map((item) => (
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
          href="/scheduler"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive("/scheduler")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <CalendarDays className="h-4 w-4" />
          Academic Scheduler
        </Link>

        <Link
          href="/calendar"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive("/calendar")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <CalendarDays className="h-4 w-4" />
          Calendar
        </Link>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
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
