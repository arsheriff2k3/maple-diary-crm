import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("departments").withIndex("by_name").collect();
  },
});

export const getById = query({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("departments")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (existing) {
      throw new Error("A department with this name already exists");
    }
    const now = Date.now();
    return await ctx.db.insert("departments", {
      name: args.name,
      visibleToStudents: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: { id: v.id("departments"), name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("departments")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (existing && existing._id !== args.id) {
      throw new Error("A department with this name already exists");
    }
    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});

export const toggleVisibility = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    const dept = await ctx.db.get(args.id);
    if (!dept) throw new Error("Department not found");
    await ctx.db.patch(args.id, {
      visibleToStudents: !dept.visibleToStudents,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_department", (q) => q.eq("departmentId", args.id))
      .collect();
    if (subjects.length > 0) {
      throw new Error(
        `Cannot delete: ${subjects.length} subject(s) belong to this department. Remove them first.`
      );
    }
    const staff = await ctx.db
      .query("staff")
      .withIndex("by_department", (q) => q.eq("departmentId", args.id))
      .collect();
    if (staff.length > 0) {
      throw new Error(
        `Cannot delete: ${staff.length} staff member(s) are assigned to this department.`
      );
    }
    await ctx.db.delete(args.id);
  },
});
