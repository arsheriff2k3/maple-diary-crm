"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useTeacherAuth } from "@/providers/TeacherAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Globe, Clock, Video, BookOpen } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const { staffId, selectedSubjectId } = useTeacherAuth();

  const student = useQuery(
    api.teacherPortal.getStudentProfile,
    staffId && selectedSubjectId
      ? {
          staffId: staffId as Id<"staff">,
          studentId: studentId as Id<"students">,
          subjectId: selectedSubjectId as Id<"subjects">,
        }
      : "skip"
  );

  if (student === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p>Student not found</p>
        <Link href="/teacher/dashboard" className={buttonVariants({ variant: "link" })}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const remaining = student.classesPerPackage - student.classesCompleted;

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/dashboard"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {student.firstName} {student.lastName}
            {!student.isActive && (
              <Badge variant="outline" className="ml-2 text-sm">
                Inactive
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Course</p>
                <p>{student.subjectName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Timezone</p>
                <p>{student.timezone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Classes</p>
                <p>
                  {student.classesCompleted}/{student.classesPerPackage}{" "}
                  completed
                  <span
                    className={remaining <= 4 ? " text-destructive font-medium" : ""}
                  >
                    {" "}({remaining} remaining)
                  </span>
                </p>
              </div>
            </div>
            {student.meetingLink && (
              <div className="flex items-center gap-3">
                <Video className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Meeting Link</p>
                  <a
                    href={student.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Open meeting
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{student.courseCompleted}</p>
              <p className="text-xs text-muted-foreground">Course Sessions Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{student.courseScheduled}</p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{remaining}</p>
              <p className="text-xs text-muted-foreground">Package Remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
