import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getStudentByPhone = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.phone.replace(/[\s\-\(\)]/g, "");

    // Try exact match on phone field
    const exact = await ctx.db
      .query("students")
      .withIndex("by_phone", (q) => q.eq("phone", normalized))
      .first();
    if (exact) return exact;

    // Also try exact match with raw input
    const raw = await ctx.db
      .query("students")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
    if (raw) return raw;

    // Fallback: scan active students and normalize
    const allStudents = await ctx.db
      .query("students")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    return (
      allStudents.find(
        (s) =>
          s.phone &&
          s.phone.replace(/[\s\-\(\)]/g, "") === normalized
      ) ?? null
    );
  },
});

export const getStudentByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});
