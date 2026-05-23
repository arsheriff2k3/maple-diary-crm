"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { generateJWT } from "./lib/auth";

export const login = action({
  args: {
    phone: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const student: any = await ctx.runQuery(
      internal.studentAuthInternal.getStudentByPhone,
      { phone: args.phone.trim() }
    );

    if (!student) {
      throw new Error("Invalid phone number or Student ID");
    }

    if (student.studentId !== args.studentId.trim().toUpperCase()) {
      throw new Error("Invalid phone number or Student ID");
    }

    if (!student.isActive) {
      throw new Error(
        "Your account has been deactivated. Please contact the administrator."
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not configured");

    const token = await generateJWT(
      { sub: student._id, role: "student" },
      secret
    );

    return {
      token,
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        subjectIds: student.subjectIds,
        region: student.region,
        timezone: student.timezone,
      },
    };
  },
});

export const forgotStudentId = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const student: any = await ctx.runQuery(
      internal.studentAuthInternal.getStudentByEmail,
      { email: args.email.trim().toLowerCase() }
    );

    if (!student || !student.isActive || !student.studentId) {
      // Don't reveal whether account exists
      return { success: true };
    }

    await ctx.runAction(internal.email.sendStudentIdReminder, {
      email: student.email,
      firstName: student.firstName,
      studentId: student.studentId,
    });

    return { success: true };
  },
});
