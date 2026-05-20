import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    region: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    subjectId: v.optional(v.id("subjects")),
  },
  handler: async (ctx, args) => {
    // If filtering by department, find all subject IDs in that department
    let departmentSubjectIds: Set<string> | null = null;
    if (args.departmentId) {
      const deptSubjects = await ctx.db
        .query("subjects")
        .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId!))
        .collect();
      departmentSubjectIds = new Set(deptSubjects.map((s) => s._id));
    }

    const matchesFilters = (student: any) => {
      if (args.subjectId && !student.subjectIds.includes(args.subjectId)) {
        return false;
      }
      if (departmentSubjectIds) {
        const hasSubjectInDept = student.subjectIds.some((sid: string) =>
          departmentSubjectIds!.has(sid)
        );
        if (!hasSubjectInDept) return false;
      }
      return true;
    };

    if (args.searchQuery && args.searchQuery.length > 0) {
      let result;
      if (args.region) {
        result = await ctx.db
          .query("students")
          .withSearchIndex("search_students", (q) =>
            q
              .search("firstName", args.searchQuery!)
              .eq("region", args.region!)
              .eq("isActive", true)
          )
          .paginate(args.paginationOpts);
      } else {
        result = await ctx.db
          .query("students")
          .withSearchIndex("search_students", (q) =>
            q.search("firstName", args.searchQuery!).eq("isActive", true)
          )
          .paginate(args.paginationOpts);
      }
      if (args.subjectId || args.departmentId) {
        return { ...result, page: result.page.filter(matchesFilters) };
      }
      return result;
    }

    let q;
    if (args.region) {
      q = ctx.db
        .query("students")
        .withIndex("by_region", (idx) => idx.eq("region", args.region!))
        .filter((f) => f.eq(f.field("isActive"), true));
    } else {
      q = ctx.db
        .query("students")
        .withIndex("by_createdAt")
        .filter((f) => f.eq(f.field("isActive"), true));
    }
    const result = await q.paginate(args.paginationOpts);
    if (args.subjectId || args.departmentId) {
      return { ...result, page: result.page.filter(matchesFilters) };
    }
    return result;
  },
});

export const getActiveDepartments = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db
      .query("students")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    // Collect all unique subject IDs across active students
    const subjectIds = new Set<string>();
    for (const s of students) {
      for (const sid of s.subjectIds) {
        subjectIds.add(sid);
      }
    }

    // Find which departments those subjects belong to
    const departmentIds = new Set<string>();
    for (const sid of subjectIds) {
      const subject = await ctx.db.get(sid as Id<"subjects">);
      if (subject) departmentIds.add(subject.departmentId);
    }

    // Fetch department details
    const departments = await Promise.all(
      [...departmentIds].map((id) => ctx.db.get(id as Id<"departments">))
    );
    return departments
      .filter(Boolean)
      .map((d) => ({ _id: d!._id, name: d!.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getById = query({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id);
    if (!student) return null;

    const subjects = await Promise.all(
      student.subjectIds.map((id) => ctx.db.get(id))
    );

    const teacherDetails = await Promise.all(
      student.teacherAssignments.map(async (ta) => {
        const staff = await ctx.db.get(ta.staffId);
        const subject = await ctx.db.get(ta.subjectId);
        return {
          subjectId: ta.subjectId,
          staffId: ta.staffId,
          meetingLink: ta.meetingLink,
          subjectName: subject?.name ?? "Unknown",
          staffName: staff
            ? `${staff.firstName} ${staff.lastName}`
            : "Unknown",
        };
      })
    );

    return {
      ...student,
      subjects: subjects.filter(Boolean).map((s) => ({
        _id: s!._id,
        name: s!.name,
      })),
      teacherDetails,
    };
  },
});

export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subjectIds: v.array(v.id("subjects")),
    region: v.string(),
    timezone: v.string(),
    teacherAssignments: v.array(
      v.object({
        subjectId: v.id("subjects"),
        staffId: v.id("staff"),
        meetingLink: v.optional(v.string()),
      })
    ),
    classesPerPackage: v.number(),
    packageStartDate: v.optional(v.number()),
    packageExpiryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      throw new Error("A student with this email already exists");
    }

    const now = Date.now();
    return await ctx.db.insert("students", {
      ...args,
      classesCompleted: 0,
      packageStartDate: args.packageStartDate ?? now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("students"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subjectIds: v.array(v.id("subjects")),
    region: v.string(),
    timezone: v.string(),
    teacherAssignments: v.array(
      v.object({
        subjectId: v.id("subjects"),
        staffId: v.id("staff"),
        meetingLink: v.optional(v.string()),
      })
    ),
    classesPerPackage: v.number(),
    packageStartDate: v.optional(v.number()),
    packageExpiryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing && existing._id !== args.id) {
      throw new Error("A student with this email already exists");
    }

    const { id, ...data } = args;
    await ctx.db.patch(id, {
      ...data,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});
