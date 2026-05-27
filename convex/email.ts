"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";

const getTransporter = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) throw new Error("GMAIL_USER or GMAIL_PASS not set");
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
};

const getFrom = () => `Maple Diary <${process.env.GMAIL_USER}>`;
const getAppUrl = () => process.env.APP_URL || "http://localhost:3000";

export const sendTeacherCredentials = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    teacherId: v.string(),
    phone: v.string(),
  },
  handler: async (_ctx, args) => {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFrom(),
      to: args.email,
      subject: "Your Teacher Account Credentials - Maple Diary",
      html: `
        <h2>Welcome to Maple Diary, ${args.firstName}!</h2>
        <p>Your teacher account has been created. Here are your login credentials:</p>
        <p><strong>Teacher ID:</strong> ${args.teacherId}</p>
        <p><strong>Phone:</strong> ${args.phone}</p>
        <p><a href="${getAppUrl()}/teacher/login">Login here</a></p>
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
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFrom(),
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
    const transporter = getTransporter();
    const resetUrl = `${getAppUrl()}/teacher/reset-password?token=${args.resetToken}`;
    await transporter.sendMail({
      from: getFrom(),
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

export const sendOtpCode = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    code: v.string(),
  },
  handler: async (_ctx, args) => {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFrom(),
      to: args.email,
      subject: "Your Verification Code - Maple Diary",
      html: `
        <h2>Verification Code</h2>
        <p>Hi ${args.firstName}, your login verification code is:</p>
        <div style="background: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #18181b;">${args.code}</span>
        </div>
        <p>This code expires in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
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
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFrom(),
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
