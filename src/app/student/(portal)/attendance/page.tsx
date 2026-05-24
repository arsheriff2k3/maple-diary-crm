"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useStudentAuth } from "@/providers/StudentAuthProvider";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { format } from "date-fns";

export default function StudentAttendancePage() {
  const { loading } = useStudentAuth();
  const [filterCourse, setFilterCourse] = useState<string>("all");

  const dashboard = useQuery(
    api.studentPortal.getMyDashboard,
    loading ? "skip" : {}
  );

  const attendance = useQuery(
    api.studentPortal.getMyAttendance,
    loading
      ? "skip"
      : {
          ...(filterCourse !== "all"
            ? { subjectId: filterCourse as Id<"subjects"> }
            : {}),
        }
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Your attendance history"
      />

      <div className="flex gap-3">
        <Select
          value={filterCourse}
          onValueChange={(v) => setFilterCourse(v ?? "all")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Courses">
              {(value: string) => {
                if (!value || value === "all") return "All Courses";
                return (
                  dashboard?.courses.find((c: any) => c._id === value)?.name ??
                  value
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {dashboard?.courses.map((c: any) => (
              <SelectItem key={c._id} value={c._id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {!attendance ? (
            <Skeleton className="h-64" />
          ) : attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No attendance records
            </p>
          ) : (
            <div className="border rounded-lg max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((s: any) => (
                    <TableRow key={s._id}>
                      <TableCell className="text-sm">
                        {format(
                          new Date(s.scheduledAt),
                          "MMM d, yyyy h:mm a"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {s.subjectName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{s.staffName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "completed"
                              ? "default"
                              : s.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.attendance ? (
                          <Badge
                            variant={
                              s.attendance === "present"
                                ? "default"
                                : s.attendance === "absent"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {s.attendance}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            --
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
