import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MentorAiAssistant from "@/components/MentorAiAssistant";
import { AuthProvider } from "@/context/AuthContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lilyestudio.com"),
  title: {
    default: "Lily Estudio — Learn. Practice. Grow.",
    template: "%s | Lily Estudio",
  },
  description:
    "A free, privacy-first study ecosystem for school (Classes 1–12), college learners, exam-prep students, and study-abroad aspirants.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body
        className={`${plusJakarta.className} antialiased min-h-screen flex flex-col bg-[#F8FAF8] text-slate-800 overflow-x-hidden`}
      >
        <AuthProvider>
          <Header />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
          <MentorAiAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}