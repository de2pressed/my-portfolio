import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import type { PropsWithChildren } from "react";

import { AppProviders } from "@/components/layout/AppProviders";
import { ExperienceShell } from "@/components/layout/ExperienceShell";

import "@/styles/design-tokens.css";
import "@/styles/globals.css";

const headingFont = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  preload: true,
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://my-portfolio-ten-iota-uezn9vq1ge.vercel.app");

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: "Jayant Kumar | Personal Portfolio",
  description:
    "A music-driven, immersive DevOps portfolio for Jayant Kumar with editable content, cinematic motion, and a glass-built interface.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Jayant Kumar | Personal Portfolio",
    description:
      "A music-driven, immersive DevOps portfolio for Jayant Kumar with editable content, cinematic motion, and a glass-built interface.",
    type: "website",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Jayant Kumar | Personal Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jayant Kumar | Personal Portfolio",
    description:
      "A music-driven, immersive DevOps portfolio for Jayant Kumar with editable content, cinematic motion, and a glass-built interface.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <AppProviders>
          <ExperienceShell>{children}</ExperienceShell>
        </AppProviders>
      </body>
    </html>
  );
}
