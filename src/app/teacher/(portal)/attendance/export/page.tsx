"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useTeacherAuth } from "@/providers/TeacherAuthProvider";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function ExportAttendancePage() {
  const { staffId, selectedSubjectId, loading } = useTeacherAuth();
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const students = useQuery(
    api.teacherPortal.getMyStudents,
    staffId && selectedSubjectId
      ? {
          staffId: staffId as Id<"staff">,
          subjectId: selectedSubjectId as Id<"subjects">,
        }
      : "skip"
  );

  const history = useQuery(
    api.teacherPortal.getAttendanceHistory,
    staffId && selectedStudentId && selectedSubjectId
      ? {
          staffId: staffId as Id<"staff">,
          studentId: selectedStudentId as Id<"students">,
          subjectId: selectedSubjectId as Id<"subjects">,
        }
      : "skip"
  );

  const selectedStudent = students?.find(
    (s: any) => s._id === selectedStudentId
  );

  const handleExport = async () => {
    if (!history || !selectedStudent) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Attendance Report", 14, 22);

    doc.setFontSize(12);
    doc.text(
      `Student: ${selectedStudent.firstName} ${selectedStudent.lastName}`,
      14,
      35
    );
    doc.text(`Timezone: ${selectedStudent.timezone}`, 14, 42);
    doc.text(`Generated: ${format(new Date(), "MMM d, yyyy")}`, 14, 49);

    let y = 62;
    doc.setFontSize(10);
    doc.text("Date", 14, y);
    doc.text("Time", 60, y);
    doc.text("Status", 100, y);
    doc.text("Attendance", 140, y);
    y += 8;

    for (const s of history) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(format(new Date(s.scheduledAt), "MMM d, yyyy"), 14, y);
      doc.text(format(new Date(s.scheduledAt), "h:mm a"), 60, y);
      doc.text(s.status, 100, y);
      doc.text(s.attendance ?? "--", 140, y);
      y += 7;
    }

    doc.save(
      `attendance_${selectedStudent.firstName}_${selectedStudent.lastName}.pdf`
    );
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
        title="Export Attendance"
        description="Download attendance records as PDF"
      />

      <Card>
        <CardContent className="pt-6 space-y-4">
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

          {selectedStudentId && history && (
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {history.length} records found
              </p>
              <Button onClick={handleExport} disabled={history.length === 0}>
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
