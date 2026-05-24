import ConvexAuthAppProvider from "@/providers/ConvexAuthAppProvider";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexAuthAppProvider portal="student">{children}</ConvexAuthAppProvider>;
}
