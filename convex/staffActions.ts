"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const createWithCredentials = action({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    departmentId: v.id("departments"),
    subjectIds: v.array(v.id("subjects")),
    countryCode: v.optional(v.string()),
    phone: v.string(),
    email: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { internal } = (await import("./_generated/api")) as any;

    const staffId = await ctx.runMutation(
      internal.staffInternal.createStaff,
      {
        ...args,
        passwordHash: "not-used",
      }
    );

    // Fetch the created staff to get their teacherId
    const staff = await ctx.runQuery(
      internal.teacherAuthInternal.getStaffByEmail,
      { email: args.email }
    );

    console.log(`[Staff] ===== TEACHER CREDENTIALS =====`);
    console.log(`[Staff] Teacher ID: ${staff?.teacherId}`);
    console.log(`[Staff] Phone: ${args.countryCode ?? ""} ${args.phone}`);
    console.log(`[Staff] ================================`);

    try {
      await ctx.runAction(internal.email.sendTeacherCredentials, {
        email: args.email,
        firstName: args.firstName,
        teacherId: staff?.teacherId ?? "N/A",
        phone: `${args.countryCode ?? ""} ${args.phone}`.trim(),
      });
    } catch (error) {
      console.error(`[Staff] Email send failed (credentials logged above):`, error);
    }

    return { staffId, teacherId: staff?.teacherId };
  },
});
