"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const forgotStudentId = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const student: any = await ctx.runQuery(
      internal.studentAuthInternal.getStudentByEmail,
      { email: args.email.trim().toLowerCase() }
    );

    if (!student || !student.isActive || !student.studentId) {
      // Don't reveal whether account exists
      return { success: true };
    }

    await ctx.runAction(internal.email.sendStudentIdReminder, {
      email: student.email,
      firstName: student.firstName,
      studentId: student.studentId,
    });

    return { success: true };
  },
});
