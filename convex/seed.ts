import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const createAdminUser = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      console.log(`Admin user already exists: ${args.email}`);
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      role: "admin",
    });

    console.log(`Admin user created: ${args.email} (${userId})`);
    return userId;
  },
});

export const fixMissingStudentIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    let fixed = 0;

    for (const student of students) {
      if (!student.studentId) {
        // Get or create counter
        let counter = await ctx.db
          .query("counters")
          .withIndex("by_name", (q) => q.eq("name", "student_id"))
          .first();

        let nextValue: number;
        if (!counter) {
          nextValue = 1;
          await ctx.db.insert("counters", { name: "student_id", value: 1 });
        } else {
          nextValue = counter.value + 1;
          await ctx.db.patch(counter._id, { value: nextValue });
        }

        const studentId = `STU-${String(nextValue).padStart(4, "0")}`;
        await ctx.db.patch(student._id, { studentId });
        console.log(`[Fix] ${student.firstName} ${student.lastName} -> ${studentId}`);
        fixed++;
      }
    }

    console.log(`Fixed ${fixed} students with missing IDs`);
  },
});

export const fixMissingTeacherIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const staff = await ctx.db.query("staff").collect();
    let fixed = 0;

    for (const s of staff) {
      if (!s.teacherId) {
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
        await ctx.db.patch(s._id, { teacherId });
        console.log(`[Fix] ${s.firstName} ${s.lastName} -> ${teacherId}`);
        fixed++;
      }
    }

    console.log(`Fixed ${fixed} staff with missing Teacher IDs`);
  },
});

export const splitPhoneFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Fix students
    const students = await ctx.db.query("students").collect();
    for (const s of students) {
      if (s.phone && !s.countryCode) {
        const match = s.phone.match(/^(\+\d+)\s+(.+)$/);
        if (match) {
          await ctx.db.patch(s._id, {
            countryCode: match[1],
            phone: match[2],
          });
          console.log(`[Student] ${s.firstName}: ${match[1]} | ${match[2]}`);
        }
      }
    }

    // Fix staff
    const staff = await ctx.db.query("staff").collect();
    for (const s of staff) {
      if (s.phone && !s.countryCode) {
        const match = s.phone.match(/^(\+\d+)\s+(.+)$/);
        if (match) {
          await ctx.db.patch(s._id, {
            countryCode: match[1],
            phone: match[2],
          });
          console.log(`[Staff] ${s.firstName}: ${match[1]} | ${match[2]}`);
        } else {
          // No country code prefix, default to +91
          await ctx.db.patch(s._id, {
            countryCode: "+91",
          });
          console.log(`[Staff] ${s.firstName}: +91 | ${s.phone} (defaulted)`);
        }
      }
    }

    console.log("Done splitting phone fields");
  },
});

export const fixMissingStaffPasswords = internalMutation({
  args: {},
  handler: async (ctx) => {
    const bcrypt = await import("bcryptjs");
    const staff = await ctx.db.query("staff").collect();
    let fixed = 0;

    for (const s of staff) {
      if (!s.passwordHash) {
        const password = "Test1234!";
        const passwordHash = await bcrypt.hash(password, 10);
        await ctx.db.patch(s._id, { passwordHash });
        console.log(`[Fix] ${s.firstName} ${s.lastName} (${s.email}) -> password set to: ${password}`);
        fixed++;
      }
    }

    console.log(`Fixed ${fixed} staff with missing passwords`);
  },
});
