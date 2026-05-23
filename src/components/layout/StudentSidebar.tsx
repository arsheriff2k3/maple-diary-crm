"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ClipboardList, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function StudentSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold tracking-tight">Maple Diary</h1>
        <p className="text-xs text-muted-foreground mt-1">Student Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/student/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive("/student/dashboard")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        <Link
          href="/student/attendance"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive("/student/attendance")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <ClipboardList className="h-4 w-4" />
          Attendance
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
