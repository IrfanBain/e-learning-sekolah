import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/context/authContext'; 
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E-Learning MTs Al-Khairiyah | Waway Karya, Tanjung Wangi",
  description: "Sistem pembelajaran online resmi untuk siswa dan guru di MTs Al-Khairiyah Tanjung Wangi Lampung Timur. Platform ini menyediakan akses mudah ke latihan, tugas, dan ujian.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id"> 
      <body className={inter.className}>
        <Toaster 
          position="top-left" 
          toastOptions={{
            duration: 3000, 
          }} 
        />
        <AuthProvider> 
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}