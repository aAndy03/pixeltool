import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://pixeltool-seven.vercel.app"),
  title: {
    default: "PixelTool - Design & Prototype",
    template: "%s | PixelTool",
  },
  description: "A powerful web-based design and pixel art tool for creators.",
  keywords: ["pixel art", "design tool", "web app", "creative", "prototype", "3d", "canvas"],
  openGraph: {
    title: "PixelTool - Design & Prototype",
    description: "A powerful web-based design and pixel art tool for creators.",
    url: "https://pixeltool-seven.vercel.app",
    siteName: "PixelTool",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelTool",
    description: "A powerful web-based design and pixel art tool.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} antialiased bg-background text-foreground`}
      >
        <div className="fixed inset-0 z-[9999] pointer-events-none bg-noise opacity-50 mix-blend-overlay"></div>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
