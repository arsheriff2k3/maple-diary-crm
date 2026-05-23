import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const createStaff = internalMutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    departmentId: v.id("departments"),
    subjectIds: v.array(v.id("subjects")),
    phone: v.string(),
    email: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
    passwordHash: v.string(),
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
      photoUrl = (await ctx.storage.getUrl(args.photoStorageId)) ?? undefined;
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
      passwordHash: args.passwordHash,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
