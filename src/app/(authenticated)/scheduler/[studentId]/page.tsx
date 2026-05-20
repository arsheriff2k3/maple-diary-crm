"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import DatePicker from "@/components/shared/DatePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  Video,
  CalendarClock,
  Mail,
  Phone,
  Globe,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { use, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  addDays,
  startOfDay,
  parse,
} from "date-fns";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StudentSchedulerPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const student = useQuery(api.students.getById, {
    id: studentId as Id<"students">,
  });
  const sessions = useQuery(api.sessions.listByStudent, {
    studentId: studentId as Id<"students">,
  });

  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"one-time" | "recurring">("one-time");
  const [rescheduleFormOpen, setRescheduleFormOpen] = useState(false);
  const [rescheduleSessionId, setRescheduleSessionId] = useState<string | null>(
    null
  );
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const createSession = useMutation(api.sessions.create);
  const createRecurring = useMutation(api.sessions.createRecurring);
  const rescheduleSession = useMutation(api.sessions.reschedule);
  const markAttendance = useMutation(api.sessions.markAttendance);
  const cancelSession = useMutation(api.sessions.cancel);

  // Shared session form state
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formStaffId, setFormStaffId] = useState("");
  const [formDuration, setFormDuration] = useState(60);
  const [formLink, setFormLink] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // One-time specific
  const [formDate, setFormDate] = useState("");
  const [formSelectedSlot, setFormSelectedSlot] = useState<number | null>(null);

  // Recurring specific
  const [recDays, setRecDays] = useState<number[]>([]);
  const [recTime, setRecTime] = useState("");
  const [recStartDate, setRecStartDate] = useState("");

  // Reschedule form state
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  // Availability slots for selected date
  const availableSlots = useQuery(
    api.sessions.getAvailableSlots,
    formDate && formStaffId
      ? {
          studentId: studentId as Id<"students">,
          staffId: formStaffId as Id<"staff">,
          date: startOfDay(parse(formDate, "yyyy-MM-dd", new Date())).getTime(),
          duration: formDuration * 60000,
        }
      : "skip"
  );

  // Calendar data
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const getSessionsForDay = (day: Date) => {
    if (!sessions) return [];
    return sessions.filter((s) =>
      isSameDay(new Date(s.scheduledAt), day)
    );
  };

  const getAttendanceColor = (session: any) => {
    if (session.status === "cancelled") return "bg-gray-300";
    if (session.attendance === "present") return "bg-green-500";
    if (session.attendance === "absent") return "bg-red-500";
    if (session.attendance === "rescheduled") return "bg-blue-500";
    if (new Date(session.scheduledAt) > new Date()) return "bg-yellow-500";
    return "bg-gray-400";
  };

  // Compute how many sessions are already scheduled (not cancelled/completed)
  const scheduledCount =
    sessions?.filter((s) => s.status === "scheduled").length ?? 0;
  const remainingToSchedule = student
    ? student.classesPerPackage - student.classesCompleted - scheduledCount
    : 0;

  // Preview recurring dates with clash info
  const recurringPreview = useMemo(() => {
    if (!recDays.length || !recTime || !recStartDate || !student) return [];
    const [hours, minutes] = recTime.split(":").map(Number);
    const start = new Date(recStartDate);
    start.setHours(hours, minutes, 0, 0);

    const totalSessions = Math.max(1, remainingToSchedule);
    const dates: Date[] = [];
    let current = new Date(start);
    let daysChecked = 0;

    while (dates.length < totalSessions && daysChecked < 365) {
      if (recDays.includes(current.getDay())) {
        const d = new Date(current);
        d.setHours(hours, minutes, 0, 0);
        dates.push(d);
      }
      current = addDays(current, 1);
      daysChecked++;
    }
    return dates;
  }, [recDays, recTime, recStartDate, student, remainingToSchedule]);

  // Check which recurring dates have existing sessions (for clash preview)
  const recurringClashInfo = useMemo(() => {
    if (!sessions || !recurringPreview.length) return new Map<number, string>();
    const clashes = new Map<number, string>();
    const duration = formDuration * 60000;
    for (const date of recurringPreview) {
      const slotStart = date.getTime();
      const slotEnd = slotStart + duration;
      for (const s of sessions) {
        if (s.status === "cancelled") continue;
        const sDur = s.duration ?? 3600000;
        const sEnd = s.scheduledAt + sDur;
        if (slotStart < sEnd && slotEnd > s.scheduledAt) {
          clashes.set(slotStart, `Clash with ${s.subjectName} (${s.staffName})`);
          break;
        }
      }
    }
    return clashes;
  }, [sessions, recurringPreview, formDuration]);

  const handleCreateSession = async () => {
    if (!formSubjectId || !formStaffId || !formSelectedSlot) {
      toast.error("Subject, date and time slot are required");
      return;
    }
    try {
      await createSession({
        studentId: studentId as Id<"students">,
        staffId: formStaffId as Id<"staff">,
        subjectId: formSubjectId as Id<"subjects">,
        scheduledAt: formSelectedSlot,
        duration: formDuration * 60000,
        meetingLink: formLink || "",
        notes: formNotes || undefined,
      });
      toast.success("Session scheduled");
      setSessionFormOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateRecurring = async () => {
    if (!formSubjectId || !formStaffId || !recDays.length || !recTime || !recStartDate) {
      toast.error("All fields are required");
      return;
    }
    if (remainingToSchedule <= 0) {
      toast.error("No remaining classes to schedule");
      return;
    }
    setFormSubmitting(true);
    try {
      const result = await createRecurring({
        studentId: studentId as Id<"students">,
        staffId: formStaffId as Id<"staff">,
        subjectId: formSubjectId as Id<"subjects">,
        daysOfWeek: recDays,
        time: recTime,
        startDate: new Date(recStartDate).getTime(),
        duration: formDuration * 60000,
        meetingLink: formLink,
        totalSessions: remainingToSchedule,
      });
      if (result.clashes.length > 0) {
        toast.warning(
          `${result.created} sessions created. ${result.clashes.length} skipped due to clashes.`
        );
      } else {
        toast.success(`${result.created} sessions scheduled successfully`);
      }
      setSessionFormOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleSessionId || !rescheduleDate || !rescheduleTime) {
      toast.error("Date and time are required");
      return;
    }
    try {
      const newScheduledAt = new Date(
        `${rescheduleDate}T${rescheduleTime}`
      ).getTime();
      const session = sessions?.find((s) => s._id === rescheduleSessionId);
      await rescheduleSession({
        id: rescheduleSessionId as Id<"sessions">,
        newScheduledAt,
        duration: session?.duration ?? undefined,
      });
      toast.success("Session rescheduled");
      setRescheduleFormOpen(false);
      setRescheduleSessionId(null);
      setRescheduleDate("");
      setRescheduleTime("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleMarkAttendance = async (
    sessionId: string,
    attendance: "present" | "absent" | "rescheduled"
  ) => {
    try {
      await markAttendance({
        id: sessionId as Id<"sessions">,
        attendance,
      });
      toast.success(`Marked as ${attendance}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancel = async (sessionId: string) => {
    try {
      await cancelSession({ id: sessionId as Id<"sessions"> });
      toast.success("Session cancelled");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetForm = () => {
    setFormSubjectId("");
    setFormStaffId("");
    setFormDate("");
    setFormSelectedSlot(null);
    setFormDuration(60);
    setFormLink("");
    setFormNotes("");
    setRecDays([]);
    setRecTime("");
    setRecStartDate("");
    setScheduleMode("one-time");
  };

  const toggleDay = (day: number) => {
    setRecDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  if (student === undefined || sessions === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p>Student not found</p>
        <Link href="/scheduler" className={buttonVariants({ variant: "link" })}>
          Back to Scheduler
        </Link>
      </div>
    );
  }

  const remaining = student.classesPerPackage - student.classesCompleted;
  const startDayOfWeek = getDay(startOfMonth(calendarMonth));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/scheduler" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scheduler
        </Link>
      </div>

      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description="Session schedule and attendance"
        action={
          <Button
            onClick={() => {
              resetForm();
              setSessionFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        }
      />

      {/* Student Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{student.email}</p>
              </div>
            </div>
            {student.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm">{student.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Region</p>
                <p className="text-sm">{student.region}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Timezone</p>
                <p className="text-sm">{student.timezone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Package Dates</p>
                <p className="text-sm">
                  {student.packageStartDate
                    ? format(new Date(student.packageStartDate), "MMM d, yyyy")
                    : "--"}
                  {" - "}
                  {student.packageExpiryDate
                    ? format(new Date(student.packageExpiryDate), "MMM d, yyyy")
                    : "--"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects & Teachers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Subjects & Teachers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {student.teacherDetails.map((td) => (
              <div
                key={td.subjectId}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <Badge variant="secondary">{td.subjectName}</Badge>
                <div className="flex items-center gap-4">
                  <span className="text-sm">{td.staffName}</span>
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
            {student.subjects
              .filter(
                (s) =>
                  !student.teacherDetails.find(
                    (td) => td.subjectId === s._id
                  )
              )
              .map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <Badge variant="secondary">{s.name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    No teacher assigned
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Classes"
          value={student.classesPerPackage}
          icon={BookOpen}
        />
        <StatCard
          label="Completed"
          value={student.classesCompleted}
          icon={CheckCircle}
        />
        <StatCard
          label="Pending"
          value={remaining}
          icon={Clock}
          color={remaining <= 4 ? "text-destructive" : "text-primary"}
        />
        <StatCard
          label="Sessions Scheduled"
          value={scheduledCount}
          icon={CalendarDays}
        />
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Attendance Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-32 text-center">
                {format(calendarMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-4 text-xs mt-2">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500" /> Present
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500" /> Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500" /> Rescheduled
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-500" /> Scheduled
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-300" /> Cancelled
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarDays.map((day) => {
              const daySessions = getSessionsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className="aspect-square border rounded-md p-1 text-xs relative"
                >
                  <span className="text-muted-foreground">
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {daySessions.map((s) => (
                      <span
                        key={s._id}
                        className={`w-2 h-2 rounded-full ${getAttendanceColor(s)}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sessions yet. Click &quot;Add Session&quot; or &quot;Recurring Schedule&quot; to get started.
            </p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session._id}>
                      <TableCell className="text-sm">
                        {format(
                          new Date(session.scheduledAt),
                          "MMM d, yyyy h:mm a"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {session.subjectName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {session.staffName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {session.duration
                          ? `${Math.round(session.duration / 60000)}m`
                          : "--"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            session.status === "completed"
                              ? "default"
                              : session.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {session.attendance ? (
                          <Badge
                            variant={
                              session.attendance === "present"
                                ? "default"
                                : session.attendance === "absent"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {session.attendance}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            --
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.status !== "cancelled" && (
                          <div className="flex gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className={buttonVariants({ variant: "outline", size: "sm" })}
                              >
                                Mark
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleMarkAttendance(
                                      session._id,
                                      "present"
                                    )
                                  }
                                >
                                  Present
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleMarkAttendance(
                                      session._id,
                                      "absent"
                                    )
                                  }
                                >
                                  Absent
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleMarkAttendance(
                                      session._id,
                                      "rescheduled"
                                    )
                                  }
                                >
                                  Rescheduled
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {session.status === "scheduled" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRescheduleSessionId(session._id);
                                    setRescheduleDate("");
                                    setRescheduleTime("");
                                    setRescheduleFormOpen(true);
                                  }}
                                >
                                  <CalendarClock className="h-3 w-3 mr-1" />
                                  Reschedule
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleCancel(session._id)}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
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

      {/* Schedule Session Dialog */}
      <Dialog open={sessionFormOpen} onOpenChange={setSessionFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Session</DialogTitle>
            {formSubjectId && formStaffId && (
              <DialogDescription>
                Teacher: {student.teacherDetails.find((t) => t.subjectId === formSubjectId)?.staffName ?? ""}
                {remainingToSchedule > 0 && scheduleMode === "recurring" && (
                  <span className="block mt-1">
                    {remainingToSchedule} session(s) remaining to schedule
                  </span>
                )}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex rounded-lg border p-1 gap-1">
              <button
                type="button"
                onClick={() => setScheduleMode("one-time")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  scheduleMode === "one-time"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                One-time Session
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode("recurring")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  scheduleMode === "recurring"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                Recurring Sessions
              </button>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={formSubjectId}
                onValueChange={(v) => {
                  setFormSubjectId(v);
                  setFormSelectedSlot(null);
                  const assignment = student.teacherAssignments.find(
                    (ta) => ta.subjectId === v
                  );
                  if (assignment) {
                    setFormStaffId(assignment.staffId);
                    const td = student.teacherDetails.find(
                      (t) => t.subjectId === v
                    );
                    setFormLink(td?.meetingLink ?? "");
                  } else {
                    setFormStaffId("");
                    setFormLink("");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject">
                    {(value: string) => {
                      if (!value) return "Select subject";
                      return student.subjects.find((s) => s._id === value)?.name ?? value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {student.subjects.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* One-time: Date + Slots */}
            {scheduleMode === "one-time" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <DatePicker
                      value={formDate}
                      onChange={(v) => {
                        setFormDate(v);
                        setFormSelectedSlot(null);
                      }}
                      placeholder="Pick a date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      min={15}
                      step={15}
                      value={formDuration}
                      onChange={(e) => {
                        setFormDuration(Number(e.target.value));
                        setFormSelectedSlot(null);
                      }}
                    />
                  </div>
                </div>

                {formDate && formStaffId && (
                  <div className="space-y-2">
                    <Label>
                      Available Slots
                      {formSelectedSlot && (
                        <span className="ml-2 text-primary font-medium">
                          - {format(new Date(formSelectedSlot), "h:mm a")}
                        </span>
                      )}
                    </Label>
                    <div className="h-48 overflow-y-auto border rounded-md p-2">
                      {!availableSlots ? (
                        <div className="grid grid-cols-4 gap-1.5">
                          {Array.from({ length: 48 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 rounded" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setFormSelectedSlot(slot.time)}
                              title={slot.conflict ?? undefined}
                              className={`px-2 py-1.5 rounded text-xs font-medium border transition-colors ${
                                formSelectedSlot === slot.time
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : slot.available
                                    ? "bg-background text-foreground border-input hover:bg-accent"
                                    : "bg-muted text-muted-foreground border-transparent cursor-not-allowed line-through"
                              }`}
                            >
                              {format(new Date(slot.time), "h:mm a")}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!formDate && formSubjectId && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Select a date to see available time slots
                  </p>
                )}
              </>
            )}

            {/* Recurring: Days + Start Date + Time */}
            {scheduleMode === "recurring" && (
              <>
                <div className="space-y-2">
                  <Label>Days of the Week</Label>
                  <div className="flex gap-2">
                    {DAY_NAMES.map((name, idx) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`w-10 h-10 rounded-md text-sm font-medium border transition-colors ${
                          recDays.includes(idx)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-input hover:bg-accent"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <DatePicker
                      value={recStartDate}
                      onChange={setRecStartDate}
                      placeholder="Start date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Select value={recTime} onValueChange={setRecTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pick time">
                          {(value: string) => {
                            if (!value) return "Pick time";
                            const [h, m] = value.split(":").map(Number);
                            const d = new Date();
                            d.setHours(h, m, 0, 0);
                            return format(d, "h:mm a");
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {Array.from({ length: 48 }).map((_, i) => {
                          const h = Math.floor(i / 2);
                          const m = (i % 2) * 30;
                          const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                          const d = new Date();
                          d.setHours(h, m, 0, 0);
                          return (
                            <SelectItem key={val} value={val}>
                              {format(d, "h:mm a")}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      min={15}
                      step={15}
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Preview with clash info */}
                {recurringPreview.length > 0 && (
                  <div className="space-y-2">
                    <Label>
                      Preview ({recurringPreview.length} sessions
                      {recurringClashInfo.size > 0 && (
                        <span className="text-destructive ml-1">
                          - {recurringClashInfo.size} clash(es) will be skipped
                        </span>
                      )}
                      )
                    </Label>
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                      {recurringPreview.map((date, i) => {
                        const clash = recurringClashInfo.get(date.getTime());
                        return (
                          <div
                            key={i}
                            className={`text-sm flex items-center justify-between gap-2 ${
                              clash ? "text-destructive" : ""
                            }`}
                          >
                            <span className="text-muted-foreground w-6">#{i + 1}</span>
                            <span className="flex-1">
                              {format(date, "EEE, MMM d, yyyy")}
                            </span>
                            <span>{format(date, "h:mm a")}</span>
                            {clash && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                Clash
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Shared fields */}
            <div className="space-y-2">
              <Label>Meeting Link</Label>
              <Input
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>
            {scheduleMode === "one-time" && (
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Session notes..."
                  rows={2}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSessionFormOpen(false)}
            >
              Cancel
            </Button>
            {scheduleMode === "one-time" ? (
              <Button
                onClick={handleCreateSession}
                disabled={!formSelectedSlot}
              >
                Schedule
              </Button>
            ) : (
              <Button
                onClick={handleCreateRecurring}
                disabled={formSubmitting || remainingToSchedule <= 0 || !recurringPreview.length}
              >
                {formSubmitting
                  ? "Creating..."
                  : `Schedule ${recurringPreview.length} Session${recurringPreview.length !== 1 ? "s" : ""}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleFormOpen} onOpenChange={setRescheduleFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
            <DialogDescription>
              The original session will be cancelled and a new one created at the
              chosen time. Clash detection will prevent overlaps.
            </DialogDescription>
          </DialogHeader>
          {rescheduleSessionId && (() => {
            const session = sessions?.find(
              (s) => s._id === rescheduleSessionId
            );
            if (!session) return null;
            return (
              <div className="text-sm text-muted-foreground mb-2">
                Original: {format(new Date(session.scheduledAt), "MMM d, yyyy h:mm a")}
                {" - "}
                {session.subjectName} with {session.staffName}
              </div>
            );
          })()}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Date</Label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>New Time</Label>
                <Input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleFormOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleReschedule}>Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
