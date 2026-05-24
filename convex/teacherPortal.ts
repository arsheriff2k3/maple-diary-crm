import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireTeacherAuth(ctx: any): Promise<Id<"staff">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "teacher" || !user.staffId)
    throw new Error("Unauthorized: teacher access required");
  return user.staffId as Id<"staff">;
}

export const getMyStudents = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const staffId = await requireTeacherAuth(ctx);

    const allStudents = await ctx.db.query("students").collect();
    const students = allStudents.filter((s) =>
      s.teacherAssignments.some(
        (ta) => ta.staffId === staffId && ta.subjectId === args.subjectId
      )
    );

    return students.map((s) => {
      const assignment = s.teacherAssignments.find(
        (ta) => ta.staffId === staffId && ta.subjectId === args.subjectId
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
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const staffId = await requireTeacherAuth(ctx);

    const now = Date.now();
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_staff_scheduledAt", (q) =>
        q.eq("staffId", staffId).gte("scheduledAt", now)
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
    studentId: v.id("students"),
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const staffId = await requireTeacherAuth(ctx);

    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    const course = await ctx.db.get(args.subjectId);
    const assignment = student.teacherAssignments.find(
      (ta) => ta.staffId === staffId && ta.subjectId === args.subjectId
    );

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
    const courseSessions = sessions.filter(
      (s) => s.subjectId === args.subjectId && s.staffId === staffId
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
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const staffId = await requireTeacherAuth(ctx);

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_staff_scheduledAt", (q) => q.eq("staffId", staffId))
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
    studentId: v.id("students"),
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const staffId = await requireTeacherAuth(ctx);

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_student_scheduledAt", (q) =>
        q.eq("studentId", args.studentId)
      )
      .order("desc")
      .collect();

    return sessions
      .filter(
        (s) => s.subjectId === args.subjectId && s.staffId === staffId
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
  args: {},
  handler: async (ctx) => {
    const staffId = await requireTeacherAuth(ctx);

    return await ctx.db
      .query("batchChangeRequests")
      .withIndex("by_staff", (q) => q.eq("staffId", staffId))
      .order("desc")
      .collect();
  },
});
