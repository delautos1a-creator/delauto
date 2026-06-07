import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Del Auto — Uvoz i prodaja vozila",
  description: "Del Auto — specijalizovani uvoznik i prodavač premium vozila. Sarajevo, BiH.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bs" className={`${geist.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
