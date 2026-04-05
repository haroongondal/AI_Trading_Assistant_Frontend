import type { Metadata } from "next";
import "./globals.css";
import { AuthBar } from "@/components/AuthBar";

export const metadata: Metadata = {
  title: "AI Trading Assistant",
  description: "Production-grade AI trading assistant with RAG, memory, and streaming",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthBar />
        {children}
      </body>
    </html>
  );
}
