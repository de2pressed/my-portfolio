import { Manrope, Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import AppShell from '../components/layout/AppShell';
import { getContentBundle, getReviews } from '../lib/content-store';
import '../styles/tokens.css';
import '../styles/global.css';
import '../styles/typography.css';
import '../styles/animations.css';

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700'],
});

const body = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata = {
  description: 'Jayant Kumar portfolio - premium glass, YouTube-first audio, Supabase-backed content.',
  title: 'Jayant Kumar | Portfolio',
};

export default async function RootLayout({ children }) {
  const [content, reviews] = await Promise.all([getContentBundle(), getReviews()]);
  const initialContent = {
    ...content,
    reviews,
  };

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <AppShell initialContent={initialContent}>{children}</AppShell>
      </body>
    </html>
  );
}
