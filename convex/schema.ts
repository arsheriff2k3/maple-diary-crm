import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  // Override users table with custom fields
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    role: v.optional(
      v.union(v.literal("admin"), v.literal("teacher"), v.literal("student"))
    ),
    staffId: v.optional(v.id("staff")),
    studentDocId: v.optional(v.id("students")),
  }).index("email", ["email"]),

  departments: defineTable({
    name: v.string(),
    visibleToStudents: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  subjects: defineTable({
    name: v.string(),
    departmentId: v.id("departments"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_department", ["departmentId"])
    .index("by_name", ["name"]),

  staff: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    teacherId: v.optional(v.string()),
    departmentId: v.id("departments"),
    subjectIds: v.array(v.id("subjects")),
    countryCode: v.optional(v.string()),
    phone: v.string(),
    email: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
    photoUrl: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    resetToken: v.optional(v.string()),
    resetTokenExpiresAt: v.optional(v.number()),
    timezone: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_department", ["departmentId"])
    .index("by_email", ["email"])
    .index("by_teacherId", ["teacherId"])
    .index("by_phone", ["phone"])
    .index("by_name", ["firstName", "lastName"])
    .index("by_isActive", ["isActive"])
    .index("by_createdAt", ["createdAt"])
    .searchIndex("search_staff", {
      searchField: "firstName",
      filterFields: ["departmentId", "isActive"],
    }),

  students: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    countryCode: v.optional(v.string()),
    phone: v.optional(v.string()),
    studentId: v.optional(v.string()),
    subjectIds: v.array(v.id("subjects")),
    region: v.string(),
    timezone: v.string(),
    meetingLink: v.optional(v.string()),
    teacherAssignments: v.array(
      v.object({
        subjectId: v.id("subjects"),
        staffId: v.id("staff"),
        meetingLink: v.optional(v.string()),
      })
    ),
    classesPerPackage: v.number(),
    classesCompleted: v.number(),
    bonusClassesCompleted: v.optional(v.number()),
    packageStartDate: v.optional(v.number()),
    packageExpiryDate: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["firstName", "lastName"])
    .index("by_email", ["email"])
    .index("by_region", ["region"])
    .index("by_isActive", ["isActive"])
    .index("by_createdAt", ["createdAt"])
    .index("by_timezone", ["timezone"])
    .index("by_studentId", ["studentId"])
    .index("by_phone", ["phone"])
    .searchIndex("search_students", {
      searchField: "firstName",
      filterFields: ["region", "timezone", "isActive"],
    }),

  sessions: defineTable({
    studentId: v.id("students"),
    staffId: v.id("staff"),
    subjectId: v.id("subjects"),
    scheduledAt: v.number(),
    duration: v.optional(v.number()),
    meetingLink: v.string(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show")
    ),
    attendance: v.optional(
      v.union(
        v.literal("present"),
        v.literal("absent"),
        v.literal("rescheduled")
      )
    ),
    attendanceMarkedAt: v.optional(v.number()),
    isBonus: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_staff", ["staffId"])
    .index("by_student_scheduledAt", ["studentId", "scheduledAt"])
    .index("by_staff_scheduledAt", ["staffId", "scheduledAt"])
    .index("by_scheduledAt", ["scheduledAt"])
    .index("by_status", ["status"]),

  batchChangeRequests: defineTable({
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
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("declined")
    ),
    adminComment: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_staff", ["staffId"])
    .index("by_createdAt", ["createdAt"]),

  paymentReminders: defineTable({
    studentId: v.id("students"),
    classesRemaining: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("dismissed"),
      v.literal("renewed")
    ),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_student", ["studentId"]),

  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),
});
