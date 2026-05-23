import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    await convex.action(api.studentAuth.forgotStudentId, { email });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
