import type { Metadata } from "next";
import { Space_Grotesk, Cormorant_Garamond, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/useWallet";
import { SiteNav } from "@/components/SiteNav";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "EPITAPH — A living archive of contested memory",
  description:
    "A decentralized legacy preservation protocol where evidence, memory, contradiction, and consensus form a public inscription of how a person should be remembered.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${cormorant.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-abyss text-bone">
        <div className="ambient-glow" />
        <div className="grain-overlay" />
        <WalletProvider>
          <SiteNav />
          <main className="relative z-10 flex-1 pt-[88px]">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
