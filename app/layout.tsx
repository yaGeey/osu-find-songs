import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"]
})
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: "osu! find songs",
  description: "Find songs from your osu! on Spotify and Youtube",
  icons: { icon: '/icon.png', },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${interTight.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
