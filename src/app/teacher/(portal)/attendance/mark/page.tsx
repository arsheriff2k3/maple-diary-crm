"use client";

import { useQuery } from "convex/react";
import { useApiMutation } from "@/hooks/useApiMutation";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useTeacherAuth } from "@/providers/TeacherAuthProvider";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";

export default function MarkAttendancePage() {
  const { selectedSubjectId, loading } = useTeacherAuth();
  const markAttendance = useApiMutation(api.sessions.markAttendance);

  const sessions = useQuery(
    api.teacherPortal.getSessionsForAttendance,
    selectedSubjectId
      ? {
          subjectId: selectedSubjectId as Id<"subjects">,
        }
      : "skip"
  );

  const handleMark = async (
    sessionId: string,
    attendance: "present" | "absent" | "rescheduled"
  ) => {
    try {
      await markAttendance({
        id: sessionId as Id<"sessions">,
        attendance,
      });
      toast.success(`Marked as ${attendance}`);
    } catch {
      // Error toast handled by useApiMutation
    }
  };

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
        title="Mark Attendance"
        description="Mark attendance for your sessions"
      />

      <Card>
        <CardContent className="pt-6">
          {!sessions ? (
            <Skeleton className="h-64" />
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No sessions to mark
            </p>
          ) : (
            <div className="border rounded-lg max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead className="w-32">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s: any) => (
                    <TableRow key={s._id}>
                      <TableCell className="text-sm">
                        {format(
                          new Date(s.scheduledAt),
                          "MMM d, yyyy h:mm a"
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {s.studentName}
                        {s.isBonus && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-[10px] text-purple-600 border-purple-300"
                          >
                            Bonus
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "completed"
                              ? "default"
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
                        {!s.attendanceMarkedAt ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="outline" size="sm">
                                Mark
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => handleMark(s._id, "present")}
                              >
                                Present
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMark(s._id, "absent")}
                              >
                                Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMark(s._id, "rescheduled")}
                              >
                                Rescheduled
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Locked
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
