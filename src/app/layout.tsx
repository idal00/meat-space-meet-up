import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["600", "700"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "meat space meet up",
  description: "Find the date that works for everyone.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="christmas" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
