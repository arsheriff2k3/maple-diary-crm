import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

export const getStaffByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("staff")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getStaffByResetToken = internalQuery({
  args: { resetToken: v.string() },
  handler: async (ctx, args) => {
    const allStaff = await ctx.db
      .query("staff")
      .filter((q) => q.eq(q.field("resetToken"), args.resetToken))
      .first();
    return allStaff;
  },
});

export const setResetToken = internalMutation({
  args: {
    staffId: v.id("staff"),
    resetToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.staffId, {
      resetToken: args.resetToken,
      resetTokenExpiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });
  },
});

export const updatePassword = internalMutation({
  args: {
    staffId: v.id("staff"),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.staffId, {
      passwordHash: args.passwordHash,
      resetToken: undefined,
      resetTokenExpiresAt: undefined,
      updatedAt: Date.now(),
    });
  },
});
