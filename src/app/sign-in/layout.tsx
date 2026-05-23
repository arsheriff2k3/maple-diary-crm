import ConvexClientProvider from "@/providers/ConvexClientProvider";

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
