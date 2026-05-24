"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useTeacherAuth } from "@/providers/TeacherAuthProvider";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AttendanceHistoryPage() {
  const { selectedSubjectId, loading } = useTeacherAuth();
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const students = useQuery(
    api.teacherPortal.getMyStudents,
    selectedSubjectId
      ? {
          subjectId: selectedSubjectId as Id<"subjects">,
        }
      : "skip"
  );

  const history = useQuery(
    api.teacherPortal.getAttendanceHistory,
    selectedStudentId && selectedSubjectId
      ? {
          studentId: selectedStudentId as Id<"students">,
          subjectId: selectedSubjectId as Id<"subjects">,
        }
      : "skip"
  );

  if (loading || !selectedSubjectId) {
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
        title="Attendance History"
        description="View attendance records for your students"
      />

      <div className="flex gap-3">
        <Select
          value={selectedStudentId}
          onValueChange={(v) => setSelectedStudentId(v ?? "")}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select student">
              {(value: string) => {
                if (!value) return "Select student";
                const s = students?.find((s: any) => s._id === value);
                return s ? `${s.firstName} ${s.lastName}` : value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {students?.map((s: any) => (
              <SelectItem key={s._id} value={s._id}>
                {s.firstName} {s.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedStudentId && (
        <Card>
          <CardContent className="pt-6">
            {!history ? (
              <Skeleton className="h-64" />
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No attendance records
              </p>
            ) : (
              <div className="border rounded-lg max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((s: any) => (
                      <TableRow key={s._id}>
                        <TableCell className="text-sm">
                          {format(
                            new Date(s.scheduledAt),
                            "MMM d, yyyy h:mm a"
                          )}
                        </TableCell>
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
                        <TableCell>
                          {s.isBonus && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-purple-600 border-purple-300"
                            >
                              Bonus
                            </Badge>
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
      )}
    </div>
  );
}
