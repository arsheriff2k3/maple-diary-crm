"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");
  return new Resend(apiKey);
};

const getAppUrl = () => process.env.APP_URL || "http://localhost:3000";

export const sendTeacherCredentials = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    password: v.string(),
  },
  handler: async (_ctx, args) => {
    const resend = getResend();
    await resend.emails.send({
      from: "Maple Diary <onboarding@resend.dev>",
      to: args.email,
      subject: "Your Teacher Account Credentials - Maple Diary",
      html: `
        <h2>Welcome to Maple Diary, ${args.firstName}!</h2>
        <p>Your teacher account has been created. Here are your login credentials:</p>
        <p><strong>Email:</strong> ${args.email}</p>
        <p><strong>Password:</strong> ${args.password}</p>
        <p><a href="${getAppUrl()}/teacher/login">Login here</a></p>
        <p>Please change your password after your first login.</p>
      `,
    });
  },
});

export const sendStudentCredentials = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    phone: v.string(),
    studentId: v.string(),
  },
  handler: async (_ctx, args) => {
    const resend = getResend();
    await resend.emails.send({
      from: "Maple Diary <onboarding@resend.dev>",
      to: args.email,
      subject: "Your Student Account - Maple Diary",
      html: `
        <h2>Welcome to Maple Diary, ${args.firstName}!</h2>
        <p>Your student account has been created. Here are your login details:</p>
        <p><strong>Student ID:</strong> ${args.studentId}</p>
        <p><strong>Phone Number:</strong> ${args.phone}</p>
        <p><a href="${getAppUrl()}/student/login">Login here</a> using your phone number and Student ID.</p>
      `,
    });
  },
});

export const sendPasswordResetLink = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    resetToken: v.string(),
  },
  handler: async (_ctx, args) => {
    const resend = getResend();
    const resetUrl = `${getAppUrl()}/teacher/reset-password?token=${args.resetToken}`;
    await resend.emails.send({
      from: "Maple Diary <onboarding@resend.dev>",
      to: args.email,
      subject: "Password Reset - Maple Diary",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${args.firstName}, we received a request to reset your password.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  },
});

export const sendStudentIdReminder = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    studentId: v.string(),
  },
  handler: async (_ctx, args) => {
    const resend = getResend();
    await resend.emails.send({
      from: "Maple Diary <onboarding@resend.dev>",
      to: args.email,
      subject: "Your Student ID - Maple Diary",
      html: `
        <h2>Student ID Reminder</h2>
        <p>Hi ${args.firstName}, your Student ID is: <strong>${args.studentId}</strong></p>
        <p><a href="${getAppUrl()}/student/login">Login here</a></p>
      `,
    });
  },
});
