import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

export const getUserByStaffId = internalQuery({
  args: { staffId: v.id("staff") },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    return users.find((u) => u.staffId === args.staffId) ?? null;
  },
});

export const getUserByStudentDocId = internalQuery({
  args: { studentDocId: v.id("students") },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    return users.find((u) => u.studentDocId === args.studentDocId) ?? null;
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
