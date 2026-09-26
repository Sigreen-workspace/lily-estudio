import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Lily Estudio — Learn. Practice. Grow.",
  description: "A free, student-centric study ecosystem for college learners, exam-prep students, and study-abroad aspirants.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3862309981201591"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-[#F8FAF8] text-slate-800">
        <AuthProvider>
          <Header />
          {/* min-h-[calc(100vh-140px)] reserves the space instantly to prevent footer shifting */}
          <main className="flex-1 w-full min-h-[calc(100vh-140px)]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}