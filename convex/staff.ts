import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    departmentId: v.optional(v.id("departments")),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.searchQuery && args.searchQuery.length > 0) {
      let results;
      if (args.departmentId) {
        results = await ctx.db
          .query("staff")
          .withSearchIndex("search_staff", (q) =>
            q
              .search("firstName", args.searchQuery!)
              .eq("departmentId", args.departmentId!)
              .eq("isActive", true)
          )
          .paginate(args.paginationOpts);
      } else {
        results = await ctx.db
          .query("staff")
          .withSearchIndex("search_staff", (q) =>
            q.search("firstName", args.searchQuery!).eq("isActive", true)
          )
          .paginate(args.paginationOpts);
      }
      return results;
    }

    let q;
    if (args.departmentId) {
      q = ctx.db
        .query("staff")
        .withIndex("by_department", (idx) =>
          idx.eq("departmentId", args.departmentId!)
        )
        .filter((f) => f.eq(f.field("isActive"), true));
    } else {
      q = ctx.db
        .query("staff")
        .withIndex("by_createdAt")
        .filter((f) => f.eq(f.field("isActive"), true));
    }
    return await q.paginate(args.paginationOpts);
  },
});

export const getById = query({
  args: { id: v.id("staff") },
  handler: async (ctx, args) => {
    const staff = await ctx.db.get(args.id);
    if (!staff) return null;

    const department = await ctx.db.get(staff.departmentId);
    const subjects = await Promise.all(
      staff.subjectIds.map((id) => ctx.db.get(id))
    );

    return {
      ...staff,
      departmentName: department?.name ?? "Unknown",
      subjects: subjects.filter(Boolean).map((s) => ({
        _id: s!._id,
        name: s!.name,
      })),
    };
  },
});

export const getBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const allStaff = await ctx.db
      .query("staff")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    return allStaff.filter((s) => s.subjectIds.includes(args.subjectId));
  },
});

export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    departmentId: v.id("departments"),
    subjectIds: v.array(v.id("subjects")),
    phone: v.string(),
    email: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("staff")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      throw new Error("A staff member with this email already exists");
    }

    let photoUrl: string | undefined;
    if (args.photoStorageId) {
      photoUrl = await ctx.storage.getUrl(args.photoStorageId) ?? undefined;
    }

    const now = Date.now();
    return await ctx.db.insert("staff", {
      firstName: args.firstName,
      lastName: args.lastName,
      departmentId: args.departmentId,
      subjectIds: args.subjectIds,
      phone: args.phone,
      email: args.email,
      photoStorageId: args.photoStorageId,
      photoUrl,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("staff"),
    firstName: v.string(),
    lastName: v.string(),
    departmentId: v.id("departments"),
    subjectIds: v.array(v.id("subjects")),
    phone: v.string(),
    email: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("staff")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing && existing._id !== args.id) {
      throw new Error("A staff member with this email already exists");
    }

    let photoUrl: string | undefined;
    if (args.photoStorageId) {
      photoUrl = await ctx.storage.getUrl(args.photoStorageId) ?? undefined;
    }

    await ctx.db.patch(args.id, {
      firstName: args.firstName,
      lastName: args.lastName,
      departmentId: args.departmentId,
      subjectIds: args.subjectIds,
      phone: args.phone,
      email: args.email,
      photoStorageId: args.photoStorageId,
      photoUrl,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("staff") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
