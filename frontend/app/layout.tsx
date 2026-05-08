import type { Metadata } from "next";
import { IBM_Plex_Mono, Oxanium } from "next/font/google";
import "./globals.css";

const heading = Oxanium({
  variable: "--font-heading",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Jarvis Command Center",
  description: "GBI Singapore multi-agent command center for live executive routing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${heading.variable} ${mono.variable} min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
