# Maple Diary — Frontend Testing Guide

## Prerequisites

### Environment Variables

Add these to `.env.local`:
```
JWT_SECRET=your-random-32-char-secret-key-here-abc123
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Set the same in Convex:
```bash
npx convex env set JWT_SECRET "your-random-32-char-secret-key-here-abc123"
npx convex env set RESEND_API_KEY "re_xxxxxxxxxxxxxxxxxxxxxxxxx"
npx convex env set APP_URL "http://localhost:3000"
```

### Start the app
```bash
npx convex dev    # Terminal 1 — Convex backend
pnpm dev          # Terminal 2 — Next.js frontend
```

App runs at `http://localhost:3000`

---

## Flow 1: Super Admin

### 1.1 Login
- Go to `http://localhost:3000/sign-in`
- Sign in with Clerk (your pre-configured admin email)
- Redirects to `/dashboard`

### 1.2 Create a Department
- Sidebar > Management > Departments
- Click "Add Department"
- Enter name (e.g., "Music") > Create
- Verify it appears in the table

### 1.3 Create a Course
- Sidebar > Management > Courses
- Click "Add Course"
- Enter name (e.g., "Piano"), select department "Music" > Create
- Verify it appears with the correct department badge

### 1.4 Create a Teacher (Staff)
- Sidebar > Management > Staff
- Click "Add Staff"
- Fill in:
  - First Name: John
  - Last Name: Smith
  - Department: Music
  - Courses: Piano
  - Email: john@gmail.com (must be Gmail)
  - Phone: +1 1234567890
- Click "Create"
- **What to verify:**
  - Staff appears in the table
  - If Resend is configured, teacher receives email with auto-generated password
  - If using `staffActions.createWithCredentials` action (see Admin Integration note below), the password is generated and hashed

> **Note:** The current admin staff form still uses the old `staff.create` mutation (no password generation). To use the new flow with credentials, the admin form needs to call `staffActions.createWithCredentials` instead. For testing the teacher login now, you can manually set a password hash via Convex dashboard:
>
> 1. Open Convex Dashboard (`npx convex dashboard`)
> 2. Go to the `staff` table
> 3. Find the teacher record
> 4. Add field `passwordHash` with a bcrypt hash
>
> Generate a hash for password "test123":
> ```bash
> node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('test123', 10).then(h => console.log(h))"
> ```
> Copy the output (e.g., `$2a$10$...`) and paste it as the `passwordHash` value.

### 1.5 Create a Student
- Sidebar > Management > Students
- Click "Add Student"
- Fill in:
  - First Name: Alice
  - Last Name: Johnson
  - Email: alice@gmail.com
  - Phone: +1 9876543210
  - Courses: Piano
  - Teacher Assignment: Select "John Smith" for Piano, add meeting link
  - Region: United States
  - Timezone: America/New_York
  - Classes per Package: 10
  - Package Start Date: today
- Click "Create"

> **Note:** Similar to staff, the admin student form still uses the old `students.create` mutation. To get auto-generated Student IDs, call `studentActions.createWithStudentId` instead. For now, manually add the `studentId` field:
>
> 1. Open Convex Dashboard
> 2. Go to `students` table
> 3. Find Alice's record
> 4. Add field `studentId` with value `STU-0001`

### 1.6 Schedule Sessions
- Sidebar > Academic Scheduler
- Click on the student row (Alice Johnson)
- Click "Schedule Session"
- Switch to "Recurring Sessions"
- Select Course: Piano
- Teacher auto-fills from assignment
- Select days: Mon, Wed
- Start Date: next Monday
- Time: 4:30 PM
- Duration: 60 min
- Meeting Link: auto-filled from assignment
- Click "Schedule X Sessions"
- **Verify:** Sessions appear in the calendar and sessions table

### 1.7 Dashboard Features
- Go to Dashboard
- **Verify:** Total Teachers, Total Students, Total Courses cards show correct counts
- When student has <= 4 classes remaining:
  - Payment reminder appears
  - Click "Renew" button
  - Dialog shows pre-filled schedule info
  - Adjust classes per package if needed
  - Click "Mark as Paid & Continue"
  - **Verify:** classesCompleted resets, new sessions auto-scheduled

### 1.8 Calendar
- Sidebar > Calendar
- **Verify:** Global calendar shows all sessions across all students/teachers
- Each cell shows: time, student name, course name
- Navigate months with arrows
- Color coding matches legend

### 1.9 Bonus Session
- Go to scheduler > student detail
- Click "Bonus Session"
- Form is forced to one-time mode
- Select course, date, time
- Schedule
- **Verify:** Session appears with purple "Bonus" badge
- Bonus stat card shows count separately

### 1.10 Filters
- Students page: Region filter + Timezone filter
- Scheduler page: Region + Timezone + Department + Course filters
- **Verify:** Filtering narrows results correctly, "Clear" resets all

---

## Flow 2: Teacher Portal

### 2.1 Login
- Go to `http://localhost:3000/teacher/login`
- Enter teacher's email (e.g., john@gmail.com)
- Enter password (the auto-generated one from email, or "test123" if set manually)
- Click "Sign In"
- **Verify:** Redirects to `/teacher/dashboard`
- Header shows teacher name + Logout button

### 2.2 Course Switch
- If teacher has multiple courses, the sidebar shows a course selector dropdown
- Switch between courses
- **Verify:** Student list and upcoming classes update to reflect selected course

### 2.3 Dashboard — My Students
- Shows table of students assigned to this teacher for the selected course
- Columns: Name, Classes (completed/total), Meeting Link
- Inactive students shown with reduced opacity + "Inactive" badge
- Click a student row
- **Verify:** Navigates to `/teacher/students/[studentId]`
- Student profile shows: course, timezone, classes, meeting link, session stats

### 2.4 Dashboard — Upcoming Classes
- Shows chronological list of scheduled sessions for selected course
- Each entry shows: student name, date/time, "Join" button
- Bonus sessions have a purple "Bonus" badge
- Click "Join" button
- **Verify:** Opens meeting link in new tab

### 2.5 Mark Attendance
- Sidebar > Attendance > Mark Attendance
- Shows list of sessions for selected course (non-cancelled)
- For sessions without attendance marked:
  - Click "Mark" dropdown
  - Select "Present", "Absent", or "Rescheduled"
- **Verify after marking Present:**
  - Attendance badge shows "Present"
  - Student's classesCompleted increments by 1
  - Button changes to "Locked" (no re-editing)
- **Verify for bonus session:**
  - bonusClassesCompleted increments instead of classesCompleted

### 2.6 Attendance History
- Sidebar > Attendance > History
- Select a student from the dropdown
- **Verify:** Shows full attendance history table
- Columns: Date & Time, Status, Attendance, Type (Bonus badge if applicable)

### 2.7 Export Attendance PDF
- Sidebar > Attendance > Export PDF
- Select a student from dropdown
- Shows record count
- Click "Export PDF"
- **Verify:** PDF downloads with student name, attendance records, dates/times

### 2.8 Batch Requests
- Sidebar > Batch Requests
- Click "New Request"
- Fill in:
  - Request Type: Reschedule
  - Description: "Need to change Wednesday slot to Thursday"
  - Proposed Date and Time (for reschedule type)
- Click "Submit Request"
- **Verify:** Request appears in the list with "pending" status
- Switch to admin portal
- Go to Dashboard > Batch Change Requests
- **Verify:** Request shows with teacher name, type, description
- Add comment, click Approve or Decline
- Switch back to teacher portal
- **Verify:** Request status updated, admin comment visible

### 2.9 Forgot Password
- Go to `/teacher/login`, click "Forgot Password?"
- Enter teacher email
- Click "Send Reset Link"
- **Verify:** Success message shown
- If Resend is configured, email arrives with reset link
- Click the link (goes to `/teacher/reset-password?token=...`)
- Enter new password + confirm
- Click "Reset Password"
- **Verify:** Success message, can now login with new password

### 2.10 Deactivated Teacher
- Admin: Go to Staff page, click delete/remove on the teacher
- Teacher: Try logging in at `/teacher/login`
- **Verify:** Error message "Your account has been deactivated. Please contact the administrator."

### 2.11 Logout
- Click "Logout" in header
- **Verify:** Redirected to `/teacher/login`
- Try accessing `/teacher/dashboard` directly
- **Verify:** Redirected back to login

---

## Flow 3: Student Portal

### 3.1 Login
- Go to `http://localhost:3000/student/login`
- Enter phone number (e.g., +1 9876543210)
- Enter Student ID (e.g., STU-0001)
- Click "Sign In"
- **Verify:** Redirects to `/student/dashboard`
- Header shows student name + Student ID + Logout button

### 3.2 Dashboard — Profile Summary
- Shows card with: Name, Region, Timezone, Courses (as badges)
- **Verify:** All details match what admin entered

### 3.3 Dashboard — Class Summary
- Shows one card per course-teacher combination
- Each card shows:
  - Course name (badge)
  - Teacher name
  - Completed count
  - Package progress (completed/total)
  - "Join Class" button (opens meeting link)
- **Verify:** If <= 4 classes remaining, "Renewal Soon" badge appears

### 3.4 Dashboard — Calendar
- Monthly calendar view
- Sessions color-coded by course (legend at top)
- Rescheduled sessions shown with dashed border
- Each cell shows: time + course name
- Navigate months with arrows
- **Verify:** Matches sessions created by admin

### 3.5 Dashboard — Upcoming Classes
- Chronological list below calendar
- Each entry: Course badge, teacher name, date/time
- "Join" button opens meeting link
- **Verify:** Only future scheduled sessions shown

### 3.6 Attendance
- Sidebar > Attendance
- Shows full attendance history table
- Columns: Date & Time, Course, Teacher, Status, Attendance
- Course filter dropdown (default "All Courses")
- Select specific course to filter
- **Verify:** Table is read-only (no action buttons)
- **Verify:** Data matches what teacher marked

### 3.7 Forgot Student ID
- Go to `/student/login`, click "Forgot Student ID?"
- Enter registered email
- Click "Send Student ID"
- **Verify:** Success message shown
- If Resend configured, email arrives with Student ID

### 3.8 Deactivated Student
- Admin: Go to Students page, click remove on the student
- Student: Try logging in at `/student/login`
- **Verify:** Error message "Your account has been deactivated. Please contact the administrator."

### 3.9 Logout
- Click "Logout" in header
- **Verify:** Redirected to `/student/login`
- Try accessing `/student/dashboard` directly
- **Verify:** Redirected back to login

---

## Cross-Portal Test Scenarios

### A. Full Session Lifecycle
1. Admin creates teacher + student + course
2. Admin schedules recurring sessions for student
3. Teacher logs in, sees student in dashboard
4. Teacher marks session as "Present"
5. Student logs in, sees updated attendance + class count decremented
6. Repeat until <= 4 classes remaining
7. Admin sees payment reminder on dashboard
8. Admin clicks "Renew", confirms
9. New sessions auto-scheduled, counts reset
10. Teacher and student see new sessions

### B. Bonus Session Flow
1. Admin creates a bonus session for a student
2. Teacher sees it with purple "Bonus" badge
3. Teacher marks it as Present
4. **Verify:** bonusClassesCompleted increments (not classesCompleted)
5. Student sees bonus session in calendar (purple)
6. Admin resets package
7. **Verify:** classesCompleted resets to 0, bonusClassesCompleted unchanged

### C. Batch Request Flow
1. Teacher submits a reschedule request
2. Admin sees it on dashboard
3. Admin approves with comment
4. Teacher sees updated status + comment

### D. Timezone Verification
- Student in America/New_York, teacher in different timezone
- Session times should display correctly per viewer's context
- Exported PDF should use student's timezone

---

## Quick Reference — URLs

| Portal   | URL                                    | Auth Method            |
|----------|----------------------------------------|------------------------|
| Admin    | `http://localhost:3000/sign-in`         | Clerk (email/password) |
| Admin    | `http://localhost:3000/dashboard`       | Clerk session          |
| Teacher  | `http://localhost:3000/teacher/login`   | Email + Password       |
| Teacher  | `http://localhost:3000/teacher/dashboard` | JWT cookie           |
| Student  | `http://localhost:3000/student/login`   | Phone + Student ID     |
| Student  | `http://localhost:3000/student/dashboard` | JWT cookie           |

## Quick Reference — Test Credentials

Set these manually in Convex Dashboard for initial testing:

| Role    | Credential                                              |
|---------|---------------------------------------------------------|
| Teacher | Email: john@gmail.com, Password: test123 (set hash manually) |
| Student | Phone: +1 9876543210, Student ID: STU-0001 (set manually)   |

Generate bcrypt hash for "test123":
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('test123', 10).then(h => console.log(h))"
```
