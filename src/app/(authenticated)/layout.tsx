import ConvexAuthAppProvider from "@/providers/ConvexAuthAppProvider";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexAuthAppProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ConvexAuthAppProvider>
  );
}
