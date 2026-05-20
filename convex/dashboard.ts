import { query } from "./_generated/server";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const staff = await ctx.db
      .query("staff")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    const students = await ctx.db
      .query("students")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    const subjects = await ctx.db.query("subjects").collect();

    return {
      teacherCount: staff.length,
      studentCount: students.length,
      subjectCount: subjects.length,
    };
  },
});

export const getPaymentReminders = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db
      .query("students")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return students
      .map((s) => ({
        _id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        classesPerPackage: s.classesPerPackage,
        classesCompleted: s.classesCompleted,
        classesRemaining: s.classesPerPackage - s.classesCompleted,
        subjectIds: s.subjectIds,
      }))
      .filter((s) => s.classesRemaining <= 4 && s.classesRemaining > 0)
      .sort((a, b) => a.classesRemaining - b.classesRemaining);
  },
});
