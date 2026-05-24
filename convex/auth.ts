import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Admin: email + password
    Password<DataModel>({
      id: "admin",
      profile(params) {
        return {
          email: (params.email as string).toLowerCase().trim(),
          name: params.name as string | undefined,
          role: "admin" as const,
        };
      },
    }),

    // Teacher: teacherId + (phone OR email)
    ConvexCredentials<DataModel>({
      id: "teacher",
      authorize: async (credentials, ctx) => {
        const teacherId = (credentials.teacherId as string)?.trim();
        const emailOrPhone = (credentials.emailOrPhone as string)?.trim();
        if (!teacherId || !emailOrPhone) return null;

        const { internal } = await import("./_generated/api");

        // Determine if input is email or phone
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

        if (!staff || !staff.isActive) return null;
        if (staff.teacherId !== teacherId) return null;

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

    // Student: studentId + (phone OR email)
    ConvexCredentials<DataModel>({
      id: "student",
      authorize: async (credentials, ctx) => {
        const studentId = (credentials.studentId as string)?.trim();
        const emailOrPhone = (credentials.emailOrPhone as string)?.trim();
        if (!studentId || !emailOrPhone) return null;

        const { internal } = await import("./_generated/api");

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

        if (!student || !student.isActive) return null;
        if (student.studentId !== studentId) return null;

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
