"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL as string;

// Separate clients per portal so each has its own auth session
const adminClient = new ConvexReactClient(convexUrl);
const teacherClient = new ConvexReactClient(convexUrl);
const studentClient = new ConvexReactClient(convexUrl);

export default function ConvexAuthAppProvider({
  children,
  portal = "admin",
}: {
  children: ReactNode;
  portal?: "admin" | "teacher" | "student";
}) {
  const client =
    portal === "teacher"
      ? teacherClient
      : portal === "student"
        ? studentClient
        : adminClient;

  return (
    <ConvexAuthProvider
      client={client}
      storageNamespace={`maple-${portal}`}
    >
      {children}
    </ConvexAuthProvider>
  );
}
