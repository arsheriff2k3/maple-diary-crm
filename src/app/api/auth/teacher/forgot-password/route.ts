import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    await convex.action(api.teacherAuth.forgotPassword, { email });
    return NextResponse.json({ success: true });
  } catch {
    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true });
  }
}
