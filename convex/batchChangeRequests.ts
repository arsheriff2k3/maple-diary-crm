import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db
      .query("batchChangeRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    return await Promise.all(
      requests.map(async (req) => {
        const staff = await ctx.db.get(req.staffId);
        return {
          ...req,
          staffName: staff
            ? `${staff.firstName} ${staff.lastName}`
            : "Unknown",
        };
      })
    );
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db
      .query("batchChangeRequests")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    return await Promise.all(
      requests.map(async (req) => {
        const staff = await ctx.db.get(req.staffId);
        return {
          ...req,
          staffName: staff
            ? `${staff.firstName} ${staff.lastName}`
            : "Unknown",
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    staffId: v.id("staff"),
    sessionId: v.optional(v.id("sessions")),
    requestType: v.union(
      v.literal("reschedule"),
      v.literal("cancel"),
      v.literal("substitute"),
      v.literal("other")
    ),
    description: v.string(),
    proposedDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("batchChangeRequests", {
      ...args,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("batchChangeRequests"),
    status: v.union(v.literal("approved"), v.literal("declined")),
    adminComment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      adminComment: args.adminComment,
      updatedAt: Date.now(),
    });
  },
});
