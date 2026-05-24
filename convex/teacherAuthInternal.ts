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

export const getStaffByPhone = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const exact = await ctx.db
      .query("staff")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
    if (exact) return exact;

    // Fallback: normalize and search
    const normalized = args.phone.replace(/[\s\-\(\)]/g, "");
    const allStaff = await ctx.db
      .query("staff")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    return (
      allStaff.find(
        (s) => s.phone.replace(/[\s\-\(\)]/g, "") === normalized
      ) ?? null
    );
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
