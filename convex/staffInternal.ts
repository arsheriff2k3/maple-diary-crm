import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const createStaff = internalMutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    departmentId: v.id("departments"),
    subjectIds: v.array(v.id("subjects")),
    countryCode: v.optional(v.string()),
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

    // Generate sequential Teacher ID
    let counter = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", "teacher_id"))
      .first();

    let nextValue: number;
    if (!counter) {
      nextValue = 1;
      await ctx.db.insert("counters", { name: "teacher_id", value: 1 });
    } else {
      nextValue = counter.value + 1;
      await ctx.db.patch(counter._id, { value: nextValue });
    }

    const teacherId = `TCH-${String(nextValue).padStart(4, "0")}`;

    let photoUrl: string | undefined;
    if (args.photoStorageId) {
      photoUrl = (await ctx.storage.getUrl(args.photoStorageId)) ?? undefined;
    }

    const now = Date.now();
    return await ctx.db.insert("staff", {
      firstName: args.firstName,
      lastName: args.lastName,
      teacherId,
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
