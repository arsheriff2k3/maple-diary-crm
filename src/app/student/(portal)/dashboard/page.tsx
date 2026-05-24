"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useStudentAuth } from "@/providers/StudentAuthProvider";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Users,
  Globe,
  Clock,
  MapPin,
  Video,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COURSE_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
];

export default function StudentDashboardPage() {
  const { loading } = useStudentAuth();
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const dashboard = useQuery(
    api.studentPortal.getMyDashboard,
    loading ? "skip" : {}
  );

  const monthStart = useMemo(() => startOfMonth(calendarMonth), [calendarMonth]);
  const monthEnd = useMemo(() => endOfMonth(calendarMonth), [calendarMonth]);

  const calendarData = useQuery(
    api.studentPortal.getMyCalendar,
    loading
      ? "skip"
      : {
          startDate: monthStart.getTime(),
          endDate: monthEnd.getTime(),
        }
  );

  const upcoming = useQuery(
    api.studentPortal.getUpcomingSessions,
    loading ? "skip" : {}
  );

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );

  const startDayOfWeek = getDay(monthStart);

  // Build course color map
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, string>();
    dashboard?.courses.forEach((c: any, i: number) => {
      map.set(c._id, COURSE_COLORS[i % COURSE_COLORS.length]);
    });
    return map;
  }, [dashboard]);

  const getSessionsForDay = (day: Date) => {
    if (!calendarData) return [];
    return calendarData.filter((s: any) =>
      isSameDay(new Date(s.scheduledAt), day)
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!dashboard) {
    return <Skeleton className="h-64" />;
  }

  const remaining = dashboard.classesPerPackage - dashboard.classesCompleted;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">
                  {dashboard.firstName} {dashboard.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Region</p>
                <p className="text-sm">{dashboard.region}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Timezone</p>
                <p className="text-sm">{dashboard.timezone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Courses</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {dashboard.courses.map((c: any) => (
                    <Badge key={c._id} variant="secondary" className="text-xs">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Summary per Course */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dashboard.teacherDetails.map((td: any) => {
          const pendingForCourse =
            dashboard.classesPerPackage - dashboard.classesCompleted;
          return (
            <Card key={`${td.subjectId}-${td.staffId}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary">{td.subjectName}</Badge>
                  {pendingForCourse <= 4 && (
                    <Badge variant="destructive" className="text-xs">
                      Renewal Soon
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teacher</span>
                    <span>{td.staffName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span>{td.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Package</span>
                    <span>
                      {dashboard.classesCompleted}/{dashboard.classesPerPackage}
                    </span>
                  </div>
                  {td.meetingLink && (
                    <a
                      href={td.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="w-full mt-2">
                        <Video className="h-3 w-3 mr-1" />
                        Join Class
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Calendar</CardTitle>
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
          <div className="flex gap-3 text-xs mt-2 flex-wrap">
            {dashboard.courses.map((c: any, i: number) => (
              <span key={c._id} className="flex items-center gap-1">
                <span
                  className={`w-3 h-3 rounded-full ${COURSE_COLORS[i % COURSE_COLORS.length]}`}
                />
                {c.name}
              </span>
            ))}
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
                  className="min-h-[80px] border rounded-md p-1 text-xs"
                >
                  <span className="text-muted-foreground">
                    {format(day, "d")}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {daySessions.map((s: any) => (
                      <div
                        key={s._id}
                        className={`px-1 py-0.5 rounded truncate text-[10px] leading-tight text-white ${
                          s.attendance === "rescheduled"
                            ? "bg-blue-400 border border-dashed border-blue-600"
                            : subjectColorMap.get(s.subjectId) ?? "bg-gray-400"
                        }`}
                        title={`${s.subjectName} - ${s.staffName} at ${format(new Date(s.scheduledAt), "h:mm a")}`}
                      >
                        {format(new Date(s.scheduledAt), "h:mm")} {s.subjectName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
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
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {s.subjectName}
                    </Badge>
                    <span className="text-sm">{s.staffName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(
                      new Date(s.scheduledAt),
                      "EEE, MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
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
  );
}
