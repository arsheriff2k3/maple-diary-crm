import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

// ── Admin helpers ──

export const getAdminByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
  },
});

export const insertAdmin = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      passwordHash: args.passwordHash,
      role: "admin",
    });
  },
});

export const updateAdminPasswordHash = internalMutation({
  args: { userId: v.id("users"), passwordHash: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { passwordHash: args.passwordHash });
  },
});

// ── Teacher/Student helpers ──

export const getUserByStaffId = internalQuery({
  args: { staffId: v.id("staff") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_staffId", (q) => q.eq("staffId", args.staffId))
      .first();
  },
});

export const getUserByStudentDocId = internalQuery({
  args: { studentDocId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_studentDocId", (q) =>
        q.eq("studentDocId", args.studentDocId)
      )
      .first();
  },
});

export const createUserForStaff = internalMutation({
  args: {
    staffId: v.id("staff"),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      staffId: args.staffId,
      email: args.email,
      name: args.name,
      role: "teacher",
    });
  },
});

export const createUserForStudent = internalMutation({
  args: {
    studentDocId: v.id("students"),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      studentDocId: args.studentDocId,
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: "student",
    });
  },
});
