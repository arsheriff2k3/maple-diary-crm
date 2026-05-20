"use client";

import { UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-end border-b bg-card px-6">
      <UserButton afterSignOutUrl="/sign-in" />
    </header>
  );
}
