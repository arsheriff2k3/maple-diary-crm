"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { hashPassword, verifyPassword } from "./lib/auth";

/** Verify admin password (bcrypt requires Node.js runtime) */
export const verifyAdminPassword = internalAction({
  args: { password: v.string(), hash: v.string() },
  handler: async (_ctx, args) => {
    return await verifyPassword(args.password, args.hash);
  },
});

/** Hash password and insert admin user. Called from ConvexCredentials authorize during signUp. */
export const createAdminWithHash = internalAction({
  args: { email: v.string(), password: v.string(), name: v.string() },
  handler: async (ctx, args): Promise<string> => {
    const hash = await hashPassword(args.password);
    const userId: string = await ctx.runMutation(
      internal.authHelpers.insertAdmin,
      {
        email: args.email,
        name: args.name,
        passwordHash: hash,
      }
    );
    return userId;
  },
});

/** Create a new admin account. Call from Convex dashboard or seed script. */
export const createAdmin = internalAction({
  args: { email: v.string(), password: v.string(), name: v.string() },
  handler: async (ctx, args): Promise<string> => {
    const existing = await ctx.runQuery(internal.authHelpers.getAdminByEmail, {
      email: args.email.toLowerCase().trim(),
    });
    if (existing) {
      throw new Error("Admin with this email already exists");
    }
    const hash = await hashPassword(args.password);
    const userId: string = await ctx.runMutation(
      internal.authHelpers.insertAdmin,
      {
        email: args.email.toLowerCase().trim(),
        name: args.name,
        passwordHash: hash,
      }
    );
    return userId;
  },
});

/** Reset an admin's password. Call from Convex dashboard if needed. */
export const resetAdminPassword = internalAction({
  args: { email: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.authHelpers.getAdminByEmail, {
      email: args.email.toLowerCase().trim(),
    });
    if (!admin) throw new Error("Admin not found");
    const hash = await hashPassword(args.newPassword);
    await ctx.runMutation(internal.authHelpers.updateAdminPasswordHash, {
      userId: admin._id,
      passwordHash: hash,
    });
    return { success: true };
  },
});
