import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Applywise | Unified Job Tracker & AI Resume Analyzer",
  description: "Track your job search, optimize your resume with AI, and land your dream job with Applywise.",
};

import { Footer } from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
        <Footer />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-card-elevated, #171717)',
              color: '#fff',
              border: '1px solid var(--border-color, #2d2d2d)',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }} 
        />
      </body>
    </html>
  );
}

