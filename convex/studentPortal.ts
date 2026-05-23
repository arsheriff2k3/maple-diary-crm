import { v } from "convex/values";
import { query } from "./_generated/server";

export const getMyDashboard = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    const courses = await Promise.all(
      student.subjectIds.map((id) => ctx.db.get(id))
    );

    const teacherDetails = await Promise.all(
      student.teacherAssignments.map(async (ta) => {
        const staff = await ctx.db.get(ta.staffId);
        const course = await ctx.db.get(ta.subjectId);

        // Get session stats for this course-teacher combo
        const sessions = await ctx.db
          .query("sessions")
          .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
          .collect();
        const comboSessions = sessions.filter(
          (s) => s.subjectId === ta.subjectId && s.staffId === ta.staffId
        );
        const completed = comboSessions.filter(
          (s) => s.attendance === "present" || s.attendance === "absent"
        ).length;

        return {
          subjectId: ta.subjectId,
          subjectName: course?.name ?? "Unknown",
          staffId: ta.staffId,
          staffName: staff
            ? `${staff.firstName} ${staff.lastName}`
            : "Unknown",
          meetingLink: ta.meetingLink,
          completed,
        };
      })
    );

    return {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      studentId: student.studentId,
      region: student.region,
      timezone: student.timezone,
      classesPerPackage: student.classesPerPackage,
      classesCompleted: student.classesCompleted,
      bonusClassesCompleted: student.bonusClassesCompleted,
      courses: courses.filter(Boolean).map((c) => ({
        _id: c!._id,
        name: c!.name,
      })),
      teacherDetails,
    };
  },
});

export const getMyCalendar = query({
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

    return await Promise.all(
      sessions.map(async (s) => {
        const course = await ctx.db.get(s.subjectId);
        const staff = await ctx.db.get(s.staffId);
        return {
          _id: s._id,
          scheduledAt: s.scheduledAt,
          status: s.status,
          attendance: s.attendance,
          duration: s.duration,
          isBonus: s.isBonus,
          meetingLink: s.meetingLink,
          subjectName: course?.name ?? "Unknown",
          subjectId: s.subjectId,
          staffName: staff
            ? `${staff.firstName} ${staff.lastName}`
            : "Unknown",
        };
      })
    );
  },
});

export const getUpcomingSessions = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_student_scheduledAt", (q) =>
        q.eq("studentId", args.studentId).gte("scheduledAt", now)
      )
      .collect();

    const upcoming = sessions.filter((s) => s.status === "scheduled");

    return await Promise.all(
      upcoming.map(async (s) => {
        const course = await ctx.db.get(s.subjectId);
        const staff = await ctx.db.get(s.staffId);
        return {
          _id: s._id,
          scheduledAt: s.scheduledAt,
          duration: s.duration,
          meetingLink: s.meetingLink,
          isBonus: s.isBonus,
          subjectName: course?.name ?? "Unknown",
          staffName: staff
            ? `${staff.firstName} ${staff.lastName}`
            : "Unknown",
        };
      })
    );
  },
});

export const getMyAttendance = query({
  args: {
    studentId: v.id("students"),
    subjectId: v.optional(v.id("subjects")),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_student_scheduledAt", (q) =>
        q.eq("studentId", args.studentId)
      )
      .order("desc")
      .collect();

    let filtered = sessions.filter(
      (s) => s.status !== "cancelled" || s.attendance
    );

    if (args.subjectId) {
      filtered = filtered.filter((s) => s.subjectId === args.subjectId);
    }

    return await Promise.all(
      filtered.map(async (s) => {
        const course = await ctx.db.get(s.subjectId);
        const staff = await ctx.db.get(s.staffId);
        return {
          _id: s._id,
          scheduledAt: s.scheduledAt,
          status: s.status,
          attendance: s.attendance,
          isBonus: s.isBonus,
          subjectName: course?.name ?? "Unknown",
          staffName: staff
            ? `${staff.firstName} ${staff.lastName}`
            : "Unknown",
        };
      })
    );
  },
});
