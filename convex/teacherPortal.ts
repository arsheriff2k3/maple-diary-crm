import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getMyStudents = query({
  args: {
    staffId: v.id("staff"),
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const allStudents = await ctx.db
      .query("students")
      .collect();

    const students = allStudents.filter((s) =>
      s.teacherAssignments.some(
        (ta) => ta.staffId === args.staffId && ta.subjectId === args.subjectId
      )
    );

    return students.map((s) => {
      const assignment = s.teacherAssignments.find(
        (ta) => ta.staffId === args.staffId && ta.subjectId === args.subjectId
      );
      return {
        _id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        timezone: s.timezone,
        classesPerPackage: s.classesPerPackage,
        classesCompleted: s.classesCompleted,
        isActive: s.isActive,
        meetingLink: assignment?.meetingLink,
      };
    });
  },
});

export const getUpcomingSessions = query({
  args: {
    staffId: v.id("staff"),
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_staff_scheduledAt", (q) =>
        q.eq("staffId", args.staffId).gte("scheduledAt", now)
      )
      .collect();

    const filtered = sessions.filter(
      (s) => s.subjectId === args.subjectId && s.status === "scheduled"
    );

    return await Promise.all(
      filtered.map(async (s) => {
        const student = await ctx.db.get(s.studentId);
        return {
          _id: s._id,
          scheduledAt: s.scheduledAt,
          duration: s.duration,
          meetingLink: s.meetingLink,
          isBonus: s.isBonus,
          studentName: student
            ? `${student.firstName} ${student.lastName}`
            : "Unknown",
          studentId: s.studentId,
        };
      })
    );
  },
});

export const getStudentProfile = query({
  args: {
    staffId: v.id("staff"),
    studentId: v.id("students"),
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    const course = await ctx.db.get(args.subjectId);
    const assignment = student.teacherAssignments.find(
      (ta) => ta.staffId === args.staffId && ta.subjectId === args.subjectId
    );

    // Get session stats for this course
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
    const courseSessions = sessions.filter(
      (s) => s.subjectId === args.subjectId && s.staffId === args.staffId
    );
    const completed = courseSessions.filter(
      (s) => s.attendance === "present" || s.attendance === "absent"
    ).length;
    const scheduled = courseSessions.filter(
      (s) => s.status === "scheduled"
    ).length;

    return {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      timezone: student.timezone,
      subjectName: course?.name ?? "Unknown",
      meetingLink: assignment?.meetingLink,
      classesPerPackage: student.classesPerPackage,
      classesCompleted: student.classesCompleted,
      courseCompleted: completed,
      courseScheduled: scheduled,
      isActive: student.isActive,
    };
  },
});

export const getSessionsForAttendance = query({
  args: {
    staffId: v.id("staff"),
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_staff_scheduledAt", (q) => q.eq("staffId", args.staffId))
      .order("desc")
      .collect();

    const filtered = sessions.filter(
      (s) => s.subjectId === args.subjectId && s.status !== "cancelled"
    );

    return await Promise.all(
      filtered.map(async (s) => {
        const student = await ctx.db.get(s.studentId);
        return {
          _id: s._id,
          scheduledAt: s.scheduledAt,
          duration: s.duration,
          status: s.status,
          attendance: s.attendance,
          attendanceMarkedAt: s.attendanceMarkedAt,
          isBonus: s.isBonus,
          studentName: student
            ? `${student.firstName} ${student.lastName}`
            : "Unknown",
          studentId: s.studentId,
        };
      })
    );
  },
});

export const getAttendanceHistory = query({
  args: {
    staffId: v.id("staff"),
    studentId: v.id("students"),
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_student_scheduledAt", (q) =>
        q.eq("studentId", args.studentId)
      )
      .order("desc")
      .collect();

    return sessions
      .filter(
        (s) => s.subjectId === args.subjectId && s.staffId === args.staffId
      )
      .map((s) => ({
        _id: s._id,
        scheduledAt: s.scheduledAt,
        status: s.status,
        attendance: s.attendance,
        isBonus: s.isBonus,
        duration: s.duration,
      }));
  },
});

export const getMyBatchRequests = query({
  args: { staffId: v.id("staff") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("batchChangeRequests")
      .withIndex("by_staff", (q) => q.eq("staffId", args.staffId))
      .order("desc")
      .collect();
  },
});
