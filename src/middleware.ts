import { NextResponse } from "next/server";

// Auth is handled client-side by ConvexAuthProvider + useConvexAuth
// and server-side by getAuthUserId(ctx) in Convex functions.
// No middleware auth checks needed.
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};
