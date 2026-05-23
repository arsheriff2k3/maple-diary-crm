import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const isAdminPublicRoute = createRouteMatcher(["/sign-in(.*)"]);

const teacherPublicPaths = [
  "/teacher/login",
  "/teacher/forgot-password",
  "/teacher/reset-password",
];

const studentPublicPaths = ["/student/login", "/student/forgot-id"];

async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;
  try {
    const key = new TextEncoder().encode(secret);
    await jwtVerify(token, key);
    return true;
  } catch {
    return false;
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes handle their own auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Teacher routes
  if (pathname.startsWith("/teacher")) {
    if (teacherPublicPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    const token = req.cookies.get("maple_teacher_token")?.value;
    if (!token || !(await verifyToken(token))) {
      return NextResponse.redirect(new URL("/teacher/login", req.url));
    }
    return NextResponse.next();
  }

  // Student routes
  if (pathname.startsWith("/student")) {
    if (studentPublicPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    const token = req.cookies.get("maple_student_token")?.value;
    if (!token || !(await verifyToken(token))) {
      return NextResponse.redirect(new URL("/student/login", req.url));
    }
    return NextResponse.next();
  }

  // Admin routes: use Clerk
  return clerkMiddleware(async (auth, request) => {
    if (!isAdminPublicRoute(request)) {
      await auth.protect();
    }
  })(req, {} as any);
}

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
