import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getStudentByPhone = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    // Try exact match first
    const exact = await ctx.db
      .query("students")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
    if (exact) return exact;

    // Fallback: normalize and search (handle format differences)
    const normalized = args.phone.replace(/[\s\-\(\)]/g, "");
    const allStudents = await ctx.db
      .query("students")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    return (
      allStudents.find(
        (s) =>
          s.phone && s.phone.replace(/[\s\-\(\)]/g, "") === normalized
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
