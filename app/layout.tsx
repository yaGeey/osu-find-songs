import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";

// This ensures that the icon CSS is loaded immediately before attempting to render icons
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
// Prevent fontawesome from dynamically adding its css since we did it manually above
config.autoAddCss = false;

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
      {/* <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
      </head> */}
      <body
        className={`${inter.variable} ${interTight.variable} antialiased font-inter`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
