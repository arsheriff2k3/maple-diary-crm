"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Clock,
  Video,
  BookOpen,
  Users,
  KeyRound,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const student = useQuery(api.students.getById, {
    id: studentId as Id<"students">,
  });

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
        <Link href="/management/students" className={buttonVariants({ variant: "link" })}>
          Back to Students
        </Link>
      </div>
    );
  }

  const progress =
    student.classesPerPackage > 0
      ? (student.classesCompleted / student.classesPerPackage) * 100
      : 0;
  const remaining = student.classesPerPackage - student.classesCompleted;

  return (
    <div>
      <div className="mb-6">
        <Link href="/management/students" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Students
        </Link>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {student.firstName} {student.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {student.studentId && (
              <div className="bg-muted/50 border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Student Login Credentials</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Student ID: </span>
                    <span className="font-mono font-medium">{student.studentId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone: </span>
                    <span className="font-mono">{student.phone || "Not set"}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{student.email}</p>
                </div>
              </div>
              {student.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p>{student.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p>{student.region}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Timezone</p>
                  <p>{student.timezone}</p>
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
                      {student.meetingLink}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Courses & Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {student.teacherDetails.map((td) => (
                <div
                  key={td.subjectId}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <Badge variant="secondary">{td.subjectName}</Badge>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {td.staffName}
                    </div>
                    {td.meetingLink && (
                      <a
                        href={td.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                      >
                        <Video className="h-3 w-3" />
                        Link
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {student.courses
                .filter(
                  (c) =>
                    !student.teacherDetails.find(
                      (td) => td.subjectId === c._id
                    )
                )
                .map((c) => (
                  <div
                    key={c._id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <Badge variant="secondary">{c.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      No teacher assigned
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Package Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-sm">
              <span>
                {student.classesCompleted} / {student.classesPerPackage}{" "}
                completed
              </span>
              <span
                className={
                  remaining <= 4 ? "text-destructive font-medium" : ""
                }
              >
                {remaining} remaining
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
