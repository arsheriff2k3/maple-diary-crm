import { convexAuth } from "@convex-dev/auth/server";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Admin: email + password login (account creation handled separately via OTP)
    ConvexCredentials<DataModel>({
      id: "admin",
      authorize: async (credentials, ctx) => {
        const email = (credentials.email as string)?.trim().toLowerCase();
        const password = (credentials.password as string);
        if (!email || !password) {
          throw new Error("Email and password are required.");
        }

        const { internal } = await import("./_generated/api");

        const user = await ctx.runQuery(internal.authHelpers.getAdminByEmail, {
          email,
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password. Please try again or create a new account.");
        }

        const valid = await ctx.runAction(
          internal.adminAuth.verifyAdminPassword,
          { password, hash: user.passwordHash }
        );

        if (!valid) {
          throw new Error("Invalid email or password. Please try again.");
        }

        return { userId: user._id };
      },
    }),

    // Teacher: teacherId + (phone OR email) + OTP verification
    ConvexCredentials<DataModel>({
      id: "teacher",
      authorize: async (credentials, ctx) => {
        const teacherId = (credentials.teacherId as string)?.trim();
        const emailOrPhone = (credentials.emailOrPhone as string)?.trim();
        const otp = (credentials.otp as string)?.trim();
        if (!teacherId || !emailOrPhone || !otp) {
          throw new Error("All fields are required.");
        }

        const { internal } = await import("./_generated/api");

        // Verify OTP
        const otpResult = await ctx.runQuery(internal.otpInternal.verify, {
          identifier: teacherId,
          portal: "teacher",
          code: otp,
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

        if (otpResult.otpId) {
          await ctx.runMutation(internal.otpInternal.markUsed, {
            id: otpResult.otpId,
          });
        }

        // Validate credentials
        const isEmail = emailOrPhone.includes("@");
        let staff;

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
          throw new Error("Invalid credentials. Teacher not found or account is inactive.");
        }
        if (staff.teacherId !== teacherId) {
          throw new Error("Invalid Teacher ID. Please check and try again.");
        }

        // Find or create auth user
        let user = await ctx.runQuery(
          internal.authHelpers.getUserByStaffId,
          { staffId: staff._id }
        );

        if (!user) {
          const userId = await ctx.runMutation(
            internal.authHelpers.createUserForStaff,
            {
              staffId: staff._id,
              email: staff.email,
              name: `${staff.firstName} ${staff.lastName}`,
            }
          );
          return { userId };
        }

        return { userId: user._id };
      },
    }),

    // Student: studentId + (phone OR email) + OTP verification
    ConvexCredentials<DataModel>({
      id: "student",
      authorize: async (credentials, ctx) => {
        const studentId = (credentials.studentId as string)?.trim();
        const emailOrPhone = (credentials.emailOrPhone as string)?.trim();
        const otp = (credentials.otp as string)?.trim();
        if (!studentId || !emailOrPhone || !otp) {
          throw new Error("All fields are required.");
        }

        const { internal } = await import("./_generated/api");

        // Verify OTP
        const otpResult = await ctx.runQuery(internal.otpInternal.verify, {
          identifier: studentId.toUpperCase(),
          portal: "student",
          code: otp,
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

        if (otpResult.otpId) {
          await ctx.runMutation(internal.otpInternal.markUsed, {
            id: otpResult.otpId,
          });
        }

        // Validate credentials
        const isEmail = emailOrPhone.includes("@");
        let student;

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
          throw new Error("Invalid credentials. Student not found or account is inactive.");
        }
        if (student.studentId?.toUpperCase() !== studentId.toUpperCase()) {
          throw new Error("Invalid Student ID. Please check and try again.");
        }

        // Find or create auth user
        let user = await ctx.runQuery(
          internal.authHelpers.getUserByStudentDocId,
          { studentDocId: student._id }
        );

        if (!user) {
          const userId = await ctx.runMutation(
            internal.authHelpers.createUserForStudent,
            {
              studentDocId: student._id,
              email: student.email,
              name: `${student.firstName} ${student.lastName}`,
              phone: student.phone,
            }
          );
          return { userId };
        }

        return { userId: user._id };
      },
    }),
  ],
});
