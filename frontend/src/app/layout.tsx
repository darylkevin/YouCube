import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TanStackQueryProvider } from "@/lib/TanStackQueryProvider";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YouCube - YouTube Transcriber & Summarizer",
  description: "Transform YouTube videos into actionable insights with AI-powered summaries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background min-h-screen`}
      >
        <TanStackQueryProvider>
          <header className="bg-card shadow-sm border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <polygon points="0,0 0,20 20,10" fill="red" />
                  </svg>
                  <span className="text-xl font-bold text-foreground">YouCube</span>
                </Link>
                <nav className="flex items-center gap-6">
                  <Link
                    href="/"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline hover:underline-offset-4"
                  >
                    Home
                  </Link>
                  <Link
                    href="/categories"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline hover:underline-offset-4"
                  >
                    Categories
                  </Link>
                  <Link
                    href="/history"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline hover:underline-offset-4"
                  >
                    History
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </TanStackQueryProvider>
      </body>
    </html>
  );
}
