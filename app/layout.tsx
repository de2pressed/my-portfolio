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
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Jayant Kumar | Personal Portfolio",
  description:
    "A music-driven, immersive DevOps portfolio for Jayant Kumar with editable content, cinematic motion, and a glass-built interface.",
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
