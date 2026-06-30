import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Study Assistant AI — Exam-ready in seconds",
  description:
    "Turn your notes & PDFs into AI-powered exam material: summaries, mark-based answers, quizzes, flashcards & study plans. Powered by Chutes LLM.",
  keywords: [
    "Smart Study Assistant",
    "AI study tool",
    "exam preparation",
    "summary generator",
    "quiz generator",
    "flashcards",
    "Chutes LLM",
  ],
  authors: [{ name: "Smart Study Assistant AI" }],
  icons: {
    icon: "",
  },
  openGraph: {
    title: "Smart Study Assistant AI",
    description: "Turn any notes into AI-powered exam preparation in seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
