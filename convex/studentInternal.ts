import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const createStudent = internalMutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subjectIds: v.array(v.id("subjects")),
    region: v.string(),
    timezone: v.string(),
    teacherAssignments: v.array(
      v.object({
        subjectId: v.id("subjects"),
        staffId: v.id("staff"),
        meetingLink: v.optional(v.string()),
      })
    ),
    classesPerPackage: v.number(),
    packageStartDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      throw new Error("A student with this email already exists");
    }

    // Generate sequential Student ID
    let counter = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", "student_id"))
      .first();

    let nextValue: number;
    if (!counter) {
      nextValue = 1;
      await ctx.db.insert("counters", {
        name: "student_id",
        value: 1,
      });
    } else {
      nextValue = counter.value + 1;
      await ctx.db.patch(counter._id, { value: nextValue });
    }

    const studentId = `STU-${String(nextValue).padStart(4, "0")}`;

    const now = Date.now();
    const docId = await ctx.db.insert("students", {
      ...args,
      studentId,
      classesCompleted: 0,
      bonusClassesCompleted: 0,
      packageStartDate: args.packageStartDate ?? now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { docId, studentId };
  },
});
