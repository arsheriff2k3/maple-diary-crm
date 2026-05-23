import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    region: v.optional(v.string()),
    timezone: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    subjectId: v.optional(v.id("subjects")),
  },
  handler: async (ctx, args) => {
    // If filtering by department, find all course IDs in that department
    let departmentCourseIds: Set<string> | null = null;
    if (args.departmentId) {
      const deptCourses = await ctx.db
        .query("subjects")
        .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId!))
        .collect();
      departmentCourseIds = new Set(deptCourses.map((c) => c._id));
    }

    const matchesFilters = (student: any) => {
      if (args.subjectId && !student.subjectIds.includes(args.subjectId)) {
        return false;
      }
      if (departmentCourseIds) {
        const hasCourseInDept = student.subjectIds.some((cid: string) =>
          departmentCourseIds!.has(cid)
        );
        if (!hasCourseInDept) return false;
      }
      if (args.timezone && student.timezone !== args.timezone) {
        return false;
      }
      return true;
    };

    if (args.searchQuery && args.searchQuery.length > 0) {
      let result;
      const buildSearch = (q: any) => {
        let chain = q.search("firstName", args.searchQuery!);
        if (args.region) chain = chain.eq("region", args.region!);
        if (args.timezone) chain = chain.eq("timezone", args.timezone!);
        chain = chain.eq("isActive", true);
        return chain;
      };

      result = await ctx.db
        .query("students")
        .withSearchIndex("search_students", buildSearch)
        .paginate(args.paginationOpts);

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
    if (args.subjectId || args.departmentId || args.timezone) {
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

    // Collect all unique course IDs across active students
    const subjectIds = new Set<string>();
    for (const s of students) {
      for (const cid of s.subjectIds) {
        subjectIds.add(cid);
      }
    }

    // Find which departments those courses belong to
    const departmentIds = new Set<string>();
    for (const cid of subjectIds) {
      const course = await ctx.db.get(cid as Id<"subjects">);
      if (course) departmentIds.add(course.departmentId);
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

    const courses = await Promise.all(
      student.subjectIds.map((id) => ctx.db.get(id))
    );

    const teacherDetails = await Promise.all(
      student.teacherAssignments.map(async (ta) => {
        const staff = await ctx.db.get(ta.staffId);
        const course = await ctx.db.get(ta.subjectId);
        return {
          subjectId: ta.subjectId,
          staffId: ta.staffId,
          meetingLink: ta.meetingLink,
          subjectName: course?.name ?? "Unknown",
          staffName: staff
            ? `${staff.firstName} ${staff.lastName}`
            : "Unknown",
        };
      })
    );

    return {
      ...student,
      courses: courses.filter(Boolean).map((c) => ({
        _id: c!._id,
        name: c!.name,
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
      bonusClassesCompleted: 0,
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

export const resetPackage = mutation({
  args: {
    id: v.id("students"),
    classesPerPackage: v.number(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id);
    if (!student) throw new Error("Student not found");

    await ctx.db.patch(args.id, {
      classesCompleted: 0,
      classesPerPackage: args.classesPerPackage,
      packageStartDate: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
