import StudentAuthProvider from "@/providers/StudentAuthProvider";
import StudentSidebar from "@/components/layout/StudentSidebar";
import StudentHeader from "@/components/layout/StudentHeader";

export default function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentAuthProvider>
      <div className="flex h-screen overflow-hidden">
        <StudentSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <StudentHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </StudentAuthProvider>
  );
}
