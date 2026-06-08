import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Note App",
  description: "A collaborative note-taking app built with Next.js and MongoDB.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. Dark Reader) mutate
    // <html>/inline styles before React hydrates, which is harmless here.
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
