import TeacherAuthProvider from "@/providers/TeacherAuthProvider";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import TeacherHeader from "@/components/layout/TeacherHeader";

export default function TeacherPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TeacherAuthProvider>
      <div className="flex h-screen overflow-hidden">
        <TeacherSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TeacherHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TeacherAuthProvider>
  );
}
