import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Tech Club Hub - London Academy",
  description: "A technology club platform for sharing resources and collaborating",
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="bg-white">
        {user && <Header />}
        {children}
      </body>
    </html>
  );
}
