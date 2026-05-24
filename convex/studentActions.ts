"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const createWithStudentId: any = internalAction({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    countryCode: v.optional(v.string()),
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
    const { internal } = await import("./_generated/api");

    const result: any = await ctx.runMutation(
      internal.studentInternal.createStudent,
      args
    );

    console.log(`[Student] ===== STUDENT CREDENTIALS =====`);
    console.log(`[Student] Student ID: ${result.studentId}`);
    console.log(`[Student] Phone: ${args.phone || "N/A"}`);
    console.log(`[Student] Email: ${args.email}`);
    console.log(`[Student] =================================`);

    if (args.phone && result.studentId) {
      try {
        await ctx.runAction(internal.email.sendStudentCredentials, {
          email: args.email,
          firstName: args.firstName,
          phone: args.phone,
          studentId: result.studentId,
        });
      } catch (error) {
        console.error(`[Student] Email send failed (credentials logged above):`, error);
      }
    }

    return result;
  },
});
