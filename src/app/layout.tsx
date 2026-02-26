import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: {
    default: "SHKKBoard - Collaborative Kanban",
    template: "%s | SHKKBoard",
  },
  description: "A collaborative Kanban board application for team productivity",
  keywords: ["kanban", "trello", "project management", "collaboration", "board"],
  authors: [{ name: "SHKKBoard" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://shkkboard.com",
    siteName: "SHKKBoard",
    title: "SHKKBoard - Collaborative Kanban",
    description: "A collaborative Kanban board application for team productivity",
  },
  twitter: {
    card: "summary_large_image",
    title: "SHKKBoard - Collaborative Kanban",
    description: "A collaborative Kanban board application for team productivity",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={cn("min-h-screen bg-gray-50 font-sans antialiased")}>
        {children}
      </body>
    </html>
  );
  );
}
