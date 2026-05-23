"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export default function CalendarPage() {
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const monthStart = useMemo(() => startOfMonth(calendarMonth), [calendarMonth]);
  const monthEnd = useMemo(() => endOfMonth(calendarMonth), [calendarMonth]);

  const sessions = useQuery(api.sessions.getGlobalCalendarData, {
    startDate: monthStart.getTime(),
    endDate: monthEnd.getTime(),
  });

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );

  const startDayOfWeek = getDay(monthStart);

  const getSessionsForDay = (day: Date) => {
    if (!sessions) return [];
    return sessions.filter((s) => isSameDay(new Date(s.scheduledAt), day));
  };

  const getCardColor = (session: any) => {
    if (session.status === "cancelled") return "bg-gray-300 text-gray-700";
    if (session.isBonus) return "bg-purple-500 text-white";
    if (session.attendance === "present") return "bg-green-500 text-white";
    if (session.attendance === "absent") return "bg-red-500 text-white";
    if (session.attendance === "rescheduled") return "bg-blue-500 text-white";
    if (new Date(session.scheduledAt) > new Date()) return "bg-yellow-500 text-white";
    return "bg-gray-400 text-white";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="All scheduled sessions across students and teachers"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Sessions Calendar</CardTitle>
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
          <div className="flex gap-4 text-xs mt-2 flex-wrap">
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
              <span className="w-3 h-3 rounded-full bg-purple-500" /> Bonus
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-300" /> Cancelled
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {!sessions ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
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
                    className="min-h-[100px] border rounded-md p-1 text-xs relative"
                  >
                    <span className="text-muted-foreground font-medium">
                      {format(day, "d")}
                    </span>
                    <div className="mt-0.5 space-y-0.5 max-h-[80px] overflow-y-auto">
                      {daySessions.map((s) => (
                        <div
                          key={s._id}
                          className={`px-1 py-0.5 rounded truncate text-[10px] leading-tight ${getCardColor(s)}`}
                          title={`${s.studentName} | ${s.subjectName} | ${s.staffName} | ${format(new Date(s.scheduledAt), "h:mm a")}${s.isBonus ? " (Bonus)" : ""}`}
                        >
                          <span className="font-medium">
                            {format(new Date(s.scheduledAt), "h:mm")}
                          </span>{" "}
                          {s.studentName.split(" ")[0]} - {s.subjectName}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
