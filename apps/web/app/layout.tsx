import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/providers';

export const metadata: Metadata = {
  title: 'PostSpritz — Create once. Spritz everywhere.',
  description: 'Create once. Spritz everywhere. Autonomous multi-channel publishing, scheduling, and AI visual studio across LinkedIn, Facebook, Instagram, Threads, X, and Reddit.',
  icons: {
    icon: [
      { url: '/favicons/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicons/favicon.ico', sizes: 'any' },
      { url: '/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/app-icons/postspritz-app-light-512.png',
  },
  openGraph: {
    title: 'PostSpritz — Create once. Spritz everywhere.',
    description: 'Publish and schedule content autonomously across your social channels.',
    images: [{ url: '/social/postspritz-social-preview-1200x630.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PostSpritz — Create once. Spritz everywhere.',
    description: 'Publish and schedule content autonomously across your social channels.',
    images: ['/social/postspritz-social-preview-1200x630.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
