"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
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
import { Users, Video, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { staffId, selectedSubjectId, loading } = useTeacherAuth();

  const students = useQuery(
    api.teacherPortal.getMyStudents,
    staffId && selectedSubjectId
      ? {
          staffId: staffId as Id<"staff">,
          subjectId: selectedSubjectId as Id<"subjects">,
        }
      : "skip"
  );

  const upcoming = useQuery(
    api.teacherPortal.getUpcomingSessions,
    staffId && selectedSubjectId
      ? {
          staffId: staffId as Id<"staff">,
          subjectId: selectedSubjectId as Id<"subjects">,
        }
      : "skip"
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!selectedSubjectId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Select a course from the sidebar to get started.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Students */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Students ({students?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!students ? (
              <Skeleton className="h-40" />
            ) : students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No students assigned for this course
              </p>
            ) : (
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Classes</TableHead>
                      <TableHead>Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s: any) => (
                      <TableRow
                        key={s._id}
                        className={`cursor-pointer ${!s.isActive ? "opacity-50" : ""}`}
                        onClick={() =>
                          router.push(`/teacher/students/${s._id}`)
                        }
                      >
                        <TableCell className="font-medium">
                          {s.firstName} {s.lastName}
                          {!s.isActive && (
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.classesCompleted}/{s.classesPerPackage}
                        </TableCell>
                        <TableCell>
                          {s.meetingLink && (
                            <a
                              href={s.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Video className="h-3 w-3" />
                              Join
                            </a>
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

        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {!upcoming ? (
              <Skeleton className="h-40" />
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming classes
              </p>
            ) : (
              upcoming.slice(0, 20).map((s: any) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{s.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(s.scheduledAt),
                        "EEE, MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                    {s.isBonus && (
                      <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-300 mt-1">
                        Bonus
                      </Badge>
                    )}
                  </div>
                  {s.meetingLink && (
                    <a
                      href={s.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        <Video className="h-3 w-3 mr-1" />
                        Join
                      </Button>
                    </a>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
