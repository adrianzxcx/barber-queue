/**
 * Root Layout — src/app/layout.tsx
 *
 * Configures the HTML shell for every page:
 *  - Loads Bebas Neue (headlines) and Inter (body) from Google Fonts.
 *  - Sets the `dark` class on <html> for permanent dark-mode.
 *  - Imports the Supremo Modern globals.css design system.
 */
import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BarberQueue | Premium Grooming & Craftsmanship",
  description:
    "Masterful grooming meets industrial luxury. Experience the Supremo standard — precision, heritage, and authority in every cut.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark h-full antialiased",
        bebasNeue.variable,
        inter.variable
      )}
    >
      <head>
        {/* Material Symbols for icon support across components */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#17130c] text-[#ebe1d6] font-sans overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
