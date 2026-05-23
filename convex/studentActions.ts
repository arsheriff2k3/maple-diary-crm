"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const createWithStudentId = action({
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
    const result: any = await ctx.runMutation(
      internal.studentInternal.createStudent,
      args
    );

    // Send credentials email (non-blocking)
    if (args.phone && result.studentId) {
      try {
        await ctx.runAction(internal.email.sendStudentCredentials, {
          email: args.email,
          firstName: args.firstName,
          phone: args.phone,
          studentId: result.studentId,
        });
      } catch {
        // Email failure shouldn't block creation
      }
    }

    return result;
  },
});
