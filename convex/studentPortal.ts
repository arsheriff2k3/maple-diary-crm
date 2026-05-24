import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireStudentAuth(ctx: any): Promise<Id<"students">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "student" || !user.studentDocId)
    throw new Error("Unauthorized: student access required");
  return user.studentDocId as Id<"students">;
}

export const getMyDashboard = query({
  args: {},
  handler: async (ctx) => {
    const studentId = await requireStudentAuth(ctx);

    const student = await ctx.db.get(studentId);
    if (!student) return null;

    const courses = await Promise.all(
      student.subjectIds.map((id) => ctx.db.get(id))
    );

    const teacherDetails = await Promise.all(
      student.teacherAssignments.map(async (ta) => {
        const staff = await ctx.db.get(ta.staffId);
        const course = await ctx.db.get(ta.subjectId);

        const sessions = await ctx.db
          .query("sessions")
          .withIndex("by_student", (q) => q.eq("studentId", studentId))
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
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const studentId = await requireStudentAuth(ctx);

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_student_scheduledAt", (q) =>
        q
          .eq("studentId", studentId)
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
  args: {},
  handler: async (ctx) => {
    const studentId = await requireStudentAuth(ctx);

    const now = Date.now();
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_student_scheduledAt", (q) =>
        q.eq("studentId", studentId).gte("scheduledAt", now)
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
    subjectId: v.optional(v.id("subjects")),
  },
  handler: async (ctx, args) => {
    const studentId = await requireStudentAuth(ctx);

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_student_scheduledAt", (q) =>
        q.eq("studentId", studentId)
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
