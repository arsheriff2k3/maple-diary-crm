"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { Users, GraduationCap, BookOpen, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DashboardPage() {
  const stats = useQuery(api.dashboard.getStats);
  const pendingRequests = useQuery(api.batchChangeRequests.listPending);
  const paymentReminders = useQuery(api.dashboard.getPaymentReminders);
  const updateRequestStatus = useMutation(api.batchChangeRequests.updateStatus);
  const resetPackage = useMutation(api.students.resetPackage);
  const createRecurring = useMutation(api.sessions.createRecurring);

  const [commentMap, setCommentMap] = useState<Record<string, string>>({});
  const [renewStudentId, setRenewStudentId] = useState<string | null>(null);

  const scheduleInfo = useQuery(
    api.sessions.getRecurringScheduleInfo,
    renewStudentId
      ? { studentId: renewStudentId as Id<"students"> }
      : "skip"
  );

  const renewStudent = paymentReminders?.find((s) => s._id === renewStudentId);

  const [renewClasses, setRenewClasses] = useState(0);
  const [renewSubmitting, setRenewSubmitting] = useState(false);

  const handleOpenRenew = (studentId: string, classesPerPackage: number) => {
    setRenewStudentId(studentId);
    setRenewClasses(classesPerPackage);
  };

  const handleRenew = async () => {
    if (!renewStudentId || renewClasses <= 0) return;
    setRenewSubmitting(true);
    try {
      await resetPackage({
        id: renewStudentId as Id<"students">,
        classesPerPackage: renewClasses,
      });

      // Auto-schedule if we have schedule info
      if (scheduleInfo) {
        const result = await createRecurring({
          studentId: renewStudentId as Id<"students">,
          staffId: scheduleInfo.staffId,
          subjectId: scheduleInfo.subjectId,
          daysOfWeek: scheduleInfo.daysOfWeek,
          time: scheduleInfo.time,
          startDate: Date.now(),
          duration: scheduleInfo.duration,
          meetingLink: scheduleInfo.meetingLink,
          totalSessions: renewClasses,
        });
        if (result.clashes.length > 0) {
          toast.warning(
            `Package renewed. ${result.created} sessions scheduled, ${result.clashes.length} skipped due to clashes.`
          );
        } else {
          toast.success(
            `Package renewed. ${result.created} sessions scheduled.`
          );
        }
      } else {
        toast.success("Package renewed. Schedule sessions manually in the scheduler.");
      }

      setRenewStudentId(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRenewSubmitting(false);
    }
  };

  const handleAction = async (
    id: string,
    status: "approved" | "declined"
  ) => {
    try {
      await updateRequestStatus({
        id: id as any,
        status,
        adminComment: commentMap[id] || undefined,
      });
      toast.success(`Request ${status}`);
      setCommentMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Teachers" value={stats.teacherCount} icon={Users} />
        <StatCard label="Total Students" value={stats.studentCount} icon={GraduationCap} />
        <StatCard label="Total Courses" value={stats.subjectCount} icon={BookOpen} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Change Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Batch Change Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {!pendingRequests ? (
              <Skeleton className="h-20" />
            ) : pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending requests
              </p>
            ) : (
              pendingRequests.map((req) => (
                <div key={req._id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{req.staffName}</p>
                      <Badge variant="outline" className="mt-1">
                        {req.requestType}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {req.description}
                  </p>
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentMap[req._id] || ""}
                    onChange={(e) =>
                      setCommentMap((prev) => ({
                        ...prev,
                        [req._id]: e.target.value,
                      }))
                    }
                    className="text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(req._id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(req._id, "declined")}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Payment Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Reminders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {!paymentReminders ? (
              <Skeleton className="h-20" />
            ) : paymentReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No payment reminders
              </p>
            ) : (
              paymentReminders.map((student) => (
                <div
                  key={student._id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/scheduler/${student._id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {student.firstName} {student.lastName}
                    </Link>
                    <Badge
                      variant={
                        student.classesRemaining <= 1
                          ? "destructive"
                          : student.classesRemaining <= 2
                            ? "default"
                            : "secondary"
                      }
                    >
                      {student.classesRemaining} classes left
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {student.classesCompleted}/{student.classesPerPackage}{" "}
                      classes completed
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleOpenRenew(student._id, student.classesPerPackage)
                      }
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Renew
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Renewal Dialog */}
      <Dialog
        open={!!renewStudentId}
        onOpenChange={() => setRenewStudentId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Package</DialogTitle>
            <DialogDescription>
              {renewStudent
                ? `${renewStudent.firstName} ${renewStudent.lastName} — Mark as paid and schedule new classes.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Classes per Package</Label>
              <Input
                type="number"
                min={1}
                value={renewClasses}
                onChange={(e) => setRenewClasses(Number(e.target.value))}
              />
            </div>
            {scheduleInfo ? (
              <div className="border rounded-lg p-3 space-y-2 bg-muted/50">
                <p className="text-sm font-medium">Previous Schedule</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Course: </span>
                    {scheduleInfo.subjectName}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Teacher: </span>
                    {scheduleInfo.staffName}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days: </span>
                    {scheduleInfo.daysOfWeek
                      .map((d) => DAY_NAMES[d])
                      .join(", ")}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time: </span>
                    {scheduleInfo.time}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration: </span>
                    {Math.round(scheduleInfo.duration / 60000)}m
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {renewClasses} sessions will be auto-scheduled using this
                  pattern starting from today.
                </p>
              </div>
            ) : scheduleInfo === undefined ? (
              <Skeleton className="h-24" />
            ) : (
              <p className="text-sm text-muted-foreground">
                No previous schedule found. You can schedule sessions manually
                after renewal.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenewStudentId(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenew}
              disabled={renewSubmitting || renewClasses <= 0}
            >
              {renewSubmitting ? "Renewing..." : "Mark as Paid & Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
