import type { Metadata } from "next";
import localFont from "next/font/local";
import { site } from "@/config/site";
import "./globals.css";

// Hanken Grotesk is an open-source stand-in for Calibre, the typeface lululemon.com uses.
const hanken = localFont({
  variable: "--font-hanken",
  display: "swap",
  src: [
    { path: "../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: { default: `${site.brandName} | Technical apparel & more`, template: `%s | ${site.brandName}` },
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${hanken.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
