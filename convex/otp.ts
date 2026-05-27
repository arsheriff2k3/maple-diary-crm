"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

function generateOtpCode(): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += digits[Math.floor(Math.random() * 10)];
  }
  return code;
}

/** Request OTP for admin sign-up (email verification before account creation) */
export const requestAdminSignUpOtp = action({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const name = args.name.trim();
    if (!email || !name) {
      throw new Error("Email and name are required");
    }

    // Check if admin with this email already exists
    const existing: any = await ctx.runQuery(
      internal.authHelpers.getAdminByEmail,
      { email }
    );

    if (existing) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }

    // Invalidate existing OTPs
    await ctx.runMutation(internal.otpInternal.invalidateExisting, {
      identifier: email,
      portal: "admin",
    });

    const code = generateOtpCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    await ctx.runMutation(internal.otpInternal.create, {
      identifier: email,
      portal: "admin",
      code,
      email,
      expiresAt,
    });

    await ctx.runAction(internal.email.sendOtpCode, {
      email,
      firstName: name,
      code,
    });

    const maskedEmail = maskEmail(email);
    return { success: true, maskedEmail };
  },
});

/** Verify OTP and create admin account. Called after requestAdminSignUpOtp. */
export const completeAdminSignUp = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const name = args.name.trim();
    const code = args.otp.trim();

    if (!email || !args.password || !name || !code) {
      throw new Error("All fields are required");
    }
    if (args.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Verify OTP
    const otpResult: any = await ctx.runQuery(internal.otpInternal.verify, {
      identifier: email,
      portal: "admin",
      code,
    });

    if (!otpResult.valid) {
      if (otpResult.otpId) {
        await ctx.runMutation(internal.otpInternal.incrementAttempts, {
          id: otpResult.otpId,
        });
      }
      throw new Error(
        otpResult.reason === "expired"
          ? "Verification code has expired. Please request a new one."
          : "Invalid verification code. Please try again."
      );
    }

    // Mark OTP as used
    if (otpResult.otpId) {
      await ctx.runMutation(internal.otpInternal.markUsed, {
        id: otpResult.otpId,
      });
    }

    // Check email not taken (race condition guard)
    const existing: any = await ctx.runQuery(
      internal.authHelpers.getAdminByEmail,
      { email }
    );
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    // Create admin account with hashed password
    await ctx.runAction(internal.adminAuth.createAdminWithHash, {
      email,
      password: args.password,
      name,
    });

    return { success: true };
  },
});

export const requestTeacherOtp = action({
  args: {
    teacherId: v.string(),
    emailOrPhone: v.string(),
  },
  handler: async (ctx, args) => {
    const teacherId = args.teacherId.trim();
    const emailOrPhone = args.emailOrPhone.trim();
    if (!teacherId || !emailOrPhone) {
      throw new Error("Teacher ID and email/phone are required");
    }

    const isEmail = emailOrPhone.includes("@");
    let staff: any;

    if (isEmail) {
      staff = await ctx.runQuery(
        internal.teacherAuthInternal.getStaffByEmail,
        { email: emailOrPhone.toLowerCase() }
      );
    } else {
      const phone = emailOrPhone.replace(/[\s\-\(\)]/g, "");
      staff = await ctx.runQuery(
        internal.teacherAuthInternal.getStaffByPhone,
        { phone }
      );
    }

    if (!staff || !staff.isActive) {
      throw new Error("Invalid credentials. Please check your Teacher ID and email/phone.");
    }
    if (staff.teacherId !== teacherId) {
      throw new Error("Invalid credentials. Please check your Teacher ID and email/phone.");
    }

    // Invalidate any existing OTPs for this teacher
    await ctx.runMutation(internal.otpInternal.invalidateExisting, {
      identifier: teacherId,
      portal: "teacher",
    });

    const code = generateOtpCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    await ctx.runMutation(internal.otpInternal.create, {
      identifier: teacherId,
      portal: "teacher",
      code,
      email: staff.email,
      expiresAt,
    });

    await ctx.runAction(internal.email.sendOtpCode, {
      email: staff.email,
      firstName: staff.firstName,
      code,
    });

    // Return masked email for UI display
    const maskedEmail = maskEmail(staff.email);
    return { success: true, maskedEmail };
  },
});

export const requestStudentOtp = action({
  args: {
    studentId: v.string(),
    emailOrPhone: v.string(),
  },
  handler: async (ctx, args) => {
    const studentId = args.studentId.trim();
    const emailOrPhone = args.emailOrPhone.trim();
    if (!studentId || !emailOrPhone) {
      throw new Error("Student ID and email/phone are required");
    }

    const isEmail = emailOrPhone.includes("@");
    let student: any;

    if (isEmail) {
      student = await ctx.runQuery(
        internal.studentAuthInternal.getStudentByEmail,
        { email: emailOrPhone.toLowerCase() }
      );
    } else {
      const phone = emailOrPhone.replace(/[\s\-\(\)]/g, "");
      student = await ctx.runQuery(
        internal.studentAuthInternal.getStudentByPhone,
        { phone }
      );
    }

    if (!student || !student.isActive) {
      throw new Error("Invalid credentials. Please check your Student ID and email/phone.");
    }
    if (student.studentId?.toUpperCase() !== studentId.toUpperCase()) {
      throw new Error("Invalid credentials. Please check your Student ID and email/phone.");
    }

    // Invalidate existing OTPs
    await ctx.runMutation(internal.otpInternal.invalidateExisting, {
      identifier: studentId.toUpperCase(),
      portal: "student",
    });

    const code = generateOtpCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    await ctx.runMutation(internal.otpInternal.create, {
      identifier: studentId.toUpperCase(),
      portal: "student",
      code,
      email: student.email,
      expiresAt,
    });

    await ctx.runAction(internal.email.sendOtpCode, {
      email: student.email,
      firstName: student.firstName,
      code,
    });

    const maskedEmail = maskEmail(student.email);
    return { success: true, maskedEmail };
  },
});

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
}
