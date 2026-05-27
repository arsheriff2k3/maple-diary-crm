"use client";

import { useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ConvexAuthAppProvider from "@/providers/ConvexAuthAppProvider";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { api } from "../../../convex/_generated/api";

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const currentUser = useQuery(api.users.currentUser);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    // If authenticated but not an admin, redirect to sign-in
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/sign-in");
    }
  }, [isLoading, isAuthenticated, currentUser, router]);

  if (isLoading || (isAuthenticated && currentUser === undefined)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || (currentUser && currentUser.role !== "admin")) {
    return null;
  }

  return <>{children}</>;
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexAuthAppProvider>
      <AdminAuthGuard>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </AdminAuthGuard>
    </ConvexAuthAppProvider>
  );
}
