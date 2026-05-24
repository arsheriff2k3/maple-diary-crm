import ConvexAuthAppProvider from "@/providers/ConvexAuthAppProvider";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexAuthAppProvider portal="teacher">{children}</ConvexAuthAppProvider>;
}
