"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { Users, GraduationCap, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function DashboardPage() {
  const stats = useQuery(api.dashboard.getStats);
  const pendingRequests = useQuery(api.batchChangeRequests.listPending);
  const paymentReminders = useQuery(api.dashboard.getPaymentReminders);
  const updateRequestStatus = useMutation(api.batchChangeRequests.updateStatus);

  const [commentMap, setCommentMap] = useState<Record<string, string>>({});

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
        <StatCard label="Total Subjects" value={stats.subjectCount} icon={BookOpen} />
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
                <Link
                  key={student._id}
                  href={`/scheduler/${student._id}`}
                  className="block border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">
                      {student.firstName} {student.lastName}
                    </p>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {student.classesCompleted}/{student.classesPerPackage}{" "}
                    classes completed
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
