import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    let q;
    if (args.departmentId) {
      q = ctx.db
        .query("subjects")
        .withIndex("by_department", (idx) =>
          idx.eq("departmentId", args.departmentId!)
        );
    } else {
      q = ctx.db.query("subjects").withIndex("by_name");
    }
    const subjects = await q.collect();

    const departmentIds = [...new Set(subjects.map((s) => s.departmentId))];
    const departments = await Promise.all(
      departmentIds.map((id) => ctx.db.get(id))
    );
    const deptMap = new Map(
      departments.filter(Boolean).map((d) => [d!._id, d!.name])
    );

    return subjects.map((s) => ({
      ...s,
      departmentName: deptMap.get(s.departmentId) ?? "Unknown",
    }));
  },
});

export const listForStudents = query({
  args: {},
  handler: async (ctx) => {
    const departments = await ctx.db.query("departments").collect();
    const visibleDeptIds = new Set(
      departments.filter((d) => d.visibleToStudents !== false).map((d) => d._id)
    );
    const subjects = await ctx.db.query("subjects").withIndex("by_name").collect();
    return subjects
      .filter((s) => visibleDeptIds.has(s.departmentId))
      .map((s) => ({
        ...s,
        departmentName: departments.find((d) => d._id === s.departmentId)?.name ?? "Unknown",
      }));
  },
});

export const getById = query({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByDepartment = query({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subjects")
      .withIndex("by_department", (q) =>
        q.eq("departmentId", args.departmentId)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("subjects", {
      name: args.name,
      departmentId: args.departmentId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("subjects"),
    name: v.string(),
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      departmentId: args.departmentId,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    const staffWithSubject = await ctx.db.query("staff").collect();
    const hasStaff = staffWithSubject.some(
      (s) => s.isActive && s.subjectIds.includes(args.id)
    );
    if (hasStaff) {
      throw new Error(
        "Cannot delete: staff members are assigned to this subject."
      );
    }
    const studentsWithSubject = await ctx.db.query("students").collect();
    const hasStudents = studentsWithSubject.some(
      (s) => s.isActive && s.subjectIds.includes(args.id)
    );
    if (hasStudents) {
      throw new Error(
        "Cannot delete: students are enrolled in this subject."
      );
    }
    await ctx.db.delete(args.id);
  },
});
