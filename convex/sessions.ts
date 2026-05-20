import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_student_scheduledAt", (q) =>
        q.eq("studentId", args.studentId)
      )
      .order("desc")
      .collect();

    return await Promise.all(
      sessions.map(async (session) => {
        const staff = await ctx.db.get(session.staffId);
        const subject = await ctx.db.get(session.subjectId);
        return {
          ...session,
          staffName: staff
            ? `${staff.firstName} ${staff.lastName}`
            : "Unknown",
          subjectName: subject?.name ?? "Unknown",
        };
      })
    );
  },
});

export const listByStaff = query({
  args: { staffId: v.id("staff") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_staff_scheduledAt", (q) => q.eq("staffId", args.staffId))
      .order("desc")
      .collect();
  },
});

export const getCalendarData = query({
  args: {
    studentId: v.id("students"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_student_scheduledAt", (q) =>
        q
          .eq("studentId", args.studentId)
          .gte("scheduledAt", args.startDate)
          .lte("scheduledAt", args.endDate)
      )
      .collect();

    return sessions.map((s) => ({
      date: s.scheduledAt,
      status: s.status,
      attendance: s.attendance,
      sessionId: s._id,
    }));
  },
});

export const getAvailableSlots = query({
  args: {
    studentId: v.id("students"),
    staffId: v.id("staff"),
    date: v.number(), // timestamp of the chosen day (start of day)
    duration: v.number(), // slot duration in ms
  },
  handler: async (ctx, args) => {
    const dayStart = args.date;
    const dayEnd = dayStart + 86400000;

    // Get student sessions for this day
    const studentSessions = await ctx.db
      .query("sessions")
      .withIndex("by_student_scheduledAt", (q) =>
        q
          .eq("studentId", args.studentId)
          .gte("scheduledAt", dayStart)
          .lte("scheduledAt", dayEnd)
      )
      .collect();

    // Get teacher sessions for this day
    const staffSessions = await ctx.db
      .query("sessions")
      .withIndex("by_staff_scheduledAt", (q) =>
        q
          .eq("staffId", args.staffId)
          .gte("scheduledAt", dayStart)
          .lte("scheduledAt", dayEnd)
      )
      .collect();

    // Build busy intervals (non-cancelled sessions)
    const busy: { start: number; end: number; label: string }[] = [];
    for (const s of studentSessions) {
      if (s.status === "cancelled") continue;
      const dur = s.duration ?? 3600000;
      const subject = await ctx.db.get(s.subjectId);
      busy.push({
        start: s.scheduledAt,
        end: s.scheduledAt + dur,
        label: `Student: ${subject?.name ?? "Class"}`,
      });
    }
    for (const s of staffSessions) {
      if (s.status === "cancelled") continue;
      if (s.studentId === args.studentId) continue; // already counted
      const dur = s.duration ?? 3600000;
      const student = await ctx.db.get(s.studentId);
      busy.push({
        start: s.scheduledAt,
        end: s.scheduledAt + dur,
        label: `Teacher: ${student ? `${student.firstName} ${student.lastName}` : "Class"}`,
      });
    }

    // Generate 30-minute slots from 00:00 to 23:30
    const slots: { time: number; available: boolean; conflict?: string }[] = [];
    for (let m = 0; m < 1440; m += 30) {
      const slotStart = dayStart + m * 60000;
      const slotEnd = slotStart + args.duration;

      let conflict: string | undefined;
      for (const b of busy) {
        if (slotStart < b.end && slotEnd > b.start) {
          conflict = b.label;
          break;
        }
      }

      slots.push({
        time: slotStart,
        available: !conflict,
        conflict,
      });
    }

    return slots;
  },
});

export const checkClash = query({
  args: {
    studentId: v.id("students"),
    staffId: v.id("staff"),
    scheduledAt: v.number(),
    duration: v.number(),
    excludeSessionId: v.optional(v.id("sessions")),
  },
  handler: async (ctx, args) => {
    const endTime = args.scheduledAt + args.duration;

    // Check student clashes
    const studentSessions = await ctx.db
      .query("sessions")
      .withIndex("by_student_scheduledAt", (q) =>
        q
          .eq("studentId", args.studentId)
          .gte("scheduledAt", args.scheduledAt - 86400000)
          .lte("scheduledAt", args.scheduledAt + 86400000)
      )
      .collect();

    for (const session of studentSessions) {
      if (session.status === "cancelled") continue;
      if (args.excludeSessionId && session._id === args.excludeSessionId) continue;
      const sessionDuration = session.duration ?? 3600000;
      const sessionEnd = session.scheduledAt + sessionDuration;
      if (args.scheduledAt < sessionEnd && endTime > session.scheduledAt) {
        const staff = await ctx.db.get(session.staffId);
        const subject = await ctx.db.get(session.subjectId);
        return {
          hasClash: true,
          type: "student" as const,
          message: `Student has a class (${subject?.name ?? "Unknown"} with ${staff ? `${staff.firstName} ${staff.lastName}` : "Unknown"}) at this time`,
        };
      }
    }

    // Check teacher clashes
    const staffSessions = await ctx.db
      .query("sessions")
      .withIndex("by_staff_scheduledAt", (q) =>
        q
          .eq("staffId", args.staffId)
          .gte("scheduledAt", args.scheduledAt - 86400000)
          .lte("scheduledAt", args.scheduledAt + 86400000)
      )
      .collect();

    for (const session of staffSessions) {
      if (session.status === "cancelled") continue;
      if (args.excludeSessionId && session._id === args.excludeSessionId) continue;
      const sessionDuration = session.duration ?? 3600000;
      const sessionEnd = session.scheduledAt + sessionDuration;
      if (args.scheduledAt < sessionEnd && endTime > session.scheduledAt) {
        const student = await ctx.db.get(session.studentId);
        const subject = await ctx.db.get(session.subjectId);
        return {
          hasClash: true,
          type: "teacher" as const,
          message: `Teacher has a class (${subject?.name ?? "Unknown"} with ${student ? `${student.firstName} ${student.lastName}` : "Unknown"}) at this time`,
        };
      }
    }

    return { hasClash: false, type: null, message: null };
  },
});

export const createRecurring = mutation({
  args: {
    studentId: v.id("students"),
    staffId: v.id("staff"),
    subjectId: v.id("subjects"),
    daysOfWeek: v.array(v.number()), // 0=Sun, 1=Mon, ..., 6=Sat
    time: v.string(), // "HH:mm" format
    startDate: v.number(), // timestamp of start date
    duration: v.number(), // milliseconds
    meetingLink: v.string(),
    totalSessions: v.number(),
  },
  handler: async (ctx, args) => {
    const [hours, minutes] = args.time.split(":").map(Number);
    const now = Date.now();
    const sessionsToCreate: number[] = [];

    // Generate dates for each day of week starting from startDate
    const startDay = new Date(args.startDate);
    startDay.setHours(hours, minutes, 0, 0);

    // Find all dates matching the selected days of week
    let currentDate = new Date(startDay);
    const maxDays = 365; // Safety limit: look at most 1 year ahead
    let daysChecked = 0;

    while (sessionsToCreate.length < args.totalSessions && daysChecked < maxDays) {
      const dayOfWeek = currentDate.getDay();
      if (args.daysOfWeek.includes(dayOfWeek)) {
        const scheduledAt = new Date(currentDate);
        scheduledAt.setHours(hours, minutes, 0, 0);
        sessionsToCreate.push(scheduledAt.getTime());
      }
      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }

    // Check for clashes and create sessions
    const clashes: { date: number; message: string }[] = [];
    const created: string[] = [];

    for (const scheduledAt of sessionsToCreate) {
      const endTime = scheduledAt + args.duration;

      // Check student clashes
      let hasClash = false;
      const studentSessions = await ctx.db
        .query("sessions")
        .withIndex("by_student_scheduledAt", (q) =>
          q
            .eq("studentId", args.studentId)
            .gte("scheduledAt", scheduledAt - 86400000)
            .lte("scheduledAt", scheduledAt + 86400000)
        )
        .collect();

      for (const session of studentSessions) {
        if (session.status === "cancelled") continue;
        const sessionDuration = session.duration ?? 3600000;
        const sessionEnd = session.scheduledAt + sessionDuration;
        if (scheduledAt < sessionEnd && endTime > session.scheduledAt) {
          clashes.push({
            date: scheduledAt,
            message: "Student has another class at this time",
          });
          hasClash = true;
          break;
        }
      }

      if (!hasClash) {
        const staffSessions = await ctx.db
          .query("sessions")
          .withIndex("by_staff_scheduledAt", (q) =>
            q
              .eq("staffId", args.staffId)
              .gte("scheduledAt", scheduledAt - 86400000)
              .lte("scheduledAt", scheduledAt + 86400000)
          )
          .collect();

        for (const session of staffSessions) {
          if (session.status === "cancelled") continue;
          const sessionDuration = session.duration ?? 3600000;
          const sessionEnd = session.scheduledAt + sessionDuration;
          if (scheduledAt < sessionEnd && endTime > session.scheduledAt) {
            clashes.push({
              date: scheduledAt,
              message: "Teacher has another class at this time",
            });
            hasClash = true;
            break;
          }
        }
      }

      if (!hasClash) {
        const id = await ctx.db.insert("sessions", {
          studentId: args.studentId,
          staffId: args.staffId,
          subjectId: args.subjectId,
          scheduledAt,
          duration: args.duration,
          meetingLink: args.meetingLink,
          status: "scheduled",
          createdAt: now,
          updatedAt: now,
        });
        created.push(id);
      }
    }

    return { created: created.length, clashes };
  },
});

export const reschedule = mutation({
  args: {
    id: v.id("sessions"),
    newScheduledAt: v.number(),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Session not found");

    const duration = args.duration ?? session.duration ?? 3600000;
    const endTime = args.newScheduledAt + duration;

    // Check student clashes
    const studentSessions = await ctx.db
      .query("sessions")
      .withIndex("by_student_scheduledAt", (q) =>
        q
          .eq("studentId", session.studentId)
          .gte("scheduledAt", args.newScheduledAt - 86400000)
          .lte("scheduledAt", args.newScheduledAt + 86400000)
      )
      .collect();

    for (const s of studentSessions) {
      if (s.status === "cancelled" || s._id === args.id) continue;
      const sDuration = s.duration ?? 3600000;
      const sEnd = s.scheduledAt + sDuration;
      if (args.newScheduledAt < sEnd && endTime > s.scheduledAt) {
        const staff = await ctx.db.get(s.staffId);
        const subject = await ctx.db.get(s.subjectId);
        throw new Error(
          `Clash: Student has ${subject?.name ?? "a class"} with ${staff ? `${staff.firstName} ${staff.lastName}` : "a teacher"} at this time`
        );
      }
    }

    // Check teacher clashes
    const staffSessions = await ctx.db
      .query("sessions")
      .withIndex("by_staff_scheduledAt", (q) =>
        q
          .eq("staffId", session.staffId)
          .gte("scheduledAt", args.newScheduledAt - 86400000)
          .lte("scheduledAt", args.newScheduledAt + 86400000)
      )
      .collect();

    for (const s of staffSessions) {
      if (s.status === "cancelled" || s._id === args.id) continue;
      const sDuration = s.duration ?? 3600000;
      const sEnd = s.scheduledAt + sDuration;
      if (args.newScheduledAt < sEnd && endTime > s.scheduledAt) {
        const student = await ctx.db.get(s.studentId);
        const subject = await ctx.db.get(s.subjectId);
        throw new Error(
          `Clash: Teacher has ${subject?.name ?? "a class"} with ${student ? `${student.firstName} ${student.lastName}` : "a student"} at this time`
        );
      }
    }

    // If old session was marked as present, decrement classesCompleted
    if (session.attendance === "present") {
      const student = await ctx.db.get(session.studentId);
      if (student) {
        await ctx.db.patch(student._id, {
          classesCompleted: Math.max(0, student.classesCompleted - 1),
          updatedAt: Date.now(),
        });
      }
    }

    // Cancel old session
    await ctx.db.patch(args.id, {
      status: "cancelled",
      attendance: "rescheduled",
      notes: `Rescheduled to ${new Date(args.newScheduledAt).toISOString()}`,
      updatedAt: Date.now(),
    });

    // Create new session
    const now = Date.now();
    return await ctx.db.insert("sessions", {
      studentId: session.studentId,
      staffId: session.staffId,
      subjectId: session.subjectId,
      scheduledAt: args.newScheduledAt,
      duration,
      meetingLink: session.meetingLink,
      status: "scheduled",
      notes: `Rescheduled from ${new Date(session.scheduledAt).toISOString()}`,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const create = mutation({
  args: {
    studentId: v.id("students"),
    staffId: v.id("staff"),
    subjectId: v.id("subjects"),
    scheduledAt: v.number(),
    duration: v.optional(v.number()),
    meetingLink: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("sessions", {
      ...args,
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("sessions"),
    scheduledAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    meetingLink: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (data.scheduledAt !== undefined) updates.scheduledAt = data.scheduledAt;
    if (data.duration !== undefined) updates.duration = data.duration;
    if (data.meetingLink !== undefined) updates.meetingLink = data.meetingLink;
    if (data.notes !== undefined) updates.notes = data.notes;
    await ctx.db.patch(id, updates);
  },
});

export const cancel = mutation({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
  },
});

export const markAttendance = mutation({
  args: {
    id: v.id("sessions"),
    attendance: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("rescheduled")
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Session not found");

    const wasPreviouslyPresent = session.attendance === "present";
    const isNowPresent = args.attendance === "present";

    await ctx.db.patch(args.id, {
      attendance: args.attendance,
      attendanceMarkedAt: Date.now(),
      status: "completed",
      updatedAt: Date.now(),
    });

    // Update student's completed classes count
    const student = await ctx.db.get(session.studentId);
    if (student) {
      if (isNowPresent && !wasPreviouslyPresent) {
        await ctx.db.patch(student._id, {
          classesCompleted: student.classesCompleted + 1,
          updatedAt: Date.now(),
        });
      } else if (!isNowPresent && wasPreviouslyPresent) {
        await ctx.db.patch(student._id, {
          classesCompleted: Math.max(0, student.classesCompleted - 1),
          updatedAt: Date.now(),
        });
      }
    }
  },
});
