import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

export const create = internalMutation({
  args: {
    identifier: v.string(),
    portal: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
    code: v.string(),
    email: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("otpCodes", {
      identifier: args.identifier,
      portal: args.portal,
      code: args.code,
      email: args.email,
      expiresAt: args.expiresAt,
      used: false,
      attempts: 0,
    });
  },
});

export const verify = internalQuery({
  args: {
    identifier: v.string(),
    portal: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const otps = await ctx.db
      .query("otpCodes")
      .withIndex("by_identifier_portal", (q) =>
        q.eq("identifier", args.identifier).eq("portal", args.portal)
      )
      .collect();

    // Find the latest valid OTP
    const otp = otps
      .filter((o) => !o.used && o.expiresAt > Date.now() && o.attempts < 5)
      .sort((a, b) => b.expiresAt - a.expiresAt)[0];

    if (!otp) return { valid: false, reason: "expired" as const };
    if (otp.code !== args.code) return { valid: false, reason: "invalid" as const, otpId: otp._id };
    return { valid: true, otpId: otp._id };
  },
});

export const markUsed = internalMutation({
  args: { id: v.id("otpCodes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { used: true });
  },
});

export const incrementAttempts = internalMutation({
  args: { id: v.id("otpCodes") },
  handler: async (ctx, args) => {
    const otp = await ctx.db.get(args.id);
    if (otp) {
      await ctx.db.patch(args.id, { attempts: otp.attempts + 1 });
    }
  },
});

export const invalidateExisting = internalMutation({
  args: {
    identifier: v.string(),
    portal: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, args) => {
    const otps = await ctx.db
      .query("otpCodes")
      .withIndex("by_identifier_portal", (q) =>
        q.eq("identifier", args.identifier).eq("portal", args.portal)
      )
      .filter((q) => q.eq(q.field("used"), false))
      .collect();

    for (const otp of otps) {
      await ctx.db.patch(otp._id, { used: true });
    }
  },
});
