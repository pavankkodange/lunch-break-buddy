import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Dashboard | Lunch Break Buddy",
  description: "Administrative panel for Lunch Break Buddy system",
};

import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen flex flex-col">
          {/* TopHeader will be included in individual pages or a wrapper layout if needed, 
               but for now pages manage their own headers or we can add a global one here if generic.
               Let's keep it clean: Sidebar fixed left, Main content pushes right. */}
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
