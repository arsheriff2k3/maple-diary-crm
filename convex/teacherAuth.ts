"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  verifyPassword,
  generateJWT,
  generateResetToken,
  hashPassword,
} from "./lib/auth";

export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const staff: any = await ctx.runQuery(internal.teacherAuthInternal.getStaffByEmail, {
      email: args.email.trim().toLowerCase(),
    });

    if (!staff) {
      throw new Error("Invalid email or password");
    }

    if (!staff.isActive) {
      throw new Error(
        "Your account has been deactivated. Please contact the administrator."
      );
    }

    if (!staff.passwordHash) {
      throw new Error("No password set for this account. Contact the administrator.");
    }

    const valid = await verifyPassword(args.password, staff.passwordHash);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not configured");

    const token = await generateJWT(
      { sub: staff._id, role: "teacher" },
      secret
    );

    return {
      token,
      staff: {
        _id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        subjectIds: staff.subjectIds,
        departmentId: staff.departmentId,
        timezone: staff.timezone,
      },
    };
  },
});

export const forgotPassword = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const staff: any = await ctx.runQuery(internal.teacherAuthInternal.getStaffByEmail, {
      email: args.email.trim().toLowerCase(),
    });

    if (!staff || !staff.isActive) {
      // Don't reveal whether account exists
      return { success: true };
    }

    const resetTokenRaw = generateResetToken();

    await ctx.runMutation(internal.teacherAuthInternal.setResetToken, {
      staffId: staff._id,
      resetToken: resetTokenRaw,
      expiresAt: Date.now() + 3600000, // 1 hour
    });

    await ctx.runAction(internal.email.sendPasswordResetLink, {
      email: staff.email,
      firstName: staff.firstName,
      resetToken: resetTokenRaw,
    });

    return { success: true };
  },
});

export const resetPassword = action({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const staff: any = await ctx.runQuery(
      internal.teacherAuthInternal.getStaffByResetToken,
      { resetToken: args.token }
    );

    if (!staff) {
      throw new Error("Invalid or expired reset token");
    }

    if (staff.resetTokenExpiresAt && staff.resetTokenExpiresAt < Date.now()) {
      throw new Error("Reset token has expired");
    }

    const hash = await hashPassword(args.newPassword);

    await ctx.runMutation(internal.teacherAuthInternal.updatePassword, {
      staffId: staff._id,
      passwordHash: hash,
    });

    return { success: true };
  },
});
