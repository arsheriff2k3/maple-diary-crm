import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { phone, studentId } = await req.json();

    const result = await convex.action(api.studentAuth.login, {
      phone,
      studentId,
    });

    const response = NextResponse.json({
      success: true,
      student: result.student,
    });

    response.cookies.set("maple_student_token", result.token, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 86400,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Login failed" },
      { status: 401 }
    );
  }
}
