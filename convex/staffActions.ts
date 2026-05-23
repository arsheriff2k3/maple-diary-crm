"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword, generateRandomPassword } from "./lib/auth";

export const createWithCredentials = action({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    departmentId: v.id("departments"),
    subjectIds: v.array(v.id("subjects")),
    phone: v.string(),
    email: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const password = generateRandomPassword();
    const passwordHash = await hashPassword(password);

    const { internal } = (await import("./_generated/api")) as any;

    const staffId = await ctx.runMutation(
      internal.staffInternal.createStaff,
      {
        ...args,
        passwordHash,
      }
    );

    try {
      await ctx.runAction(internal.email.sendTeacherCredentials, {
        email: args.email,
        firstName: args.firstName,
        password,
      });
    } catch {
      // Email failure shouldn't block creation
    }

    return { staffId, password };
  },
});
