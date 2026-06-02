import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://naijavote.ng';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    template: '%s | NaijaVote',
    default: 'NaijaVote — Know Your Candidate Nigeria',
  },
  description:
    'Research Nigerian election candidates, compare manifestos, check track records and make an informed vote for the 2027 general elections.',
  keywords: [
    'Nigeria election 2027', 'INEC', 'Nigerian candidates', 'voter education',
    'APC', 'PDP', 'Labour Party', 'NaijaVote', 'know your candidate Nigeria',
  ],
  authors:   [{ name: 'NaijaVote Nigeria' }],
  creator:   'NaijaVote Nigeria',
  publisher: 'NaijaVote Nigeria',

  // Favicons
  icons: {
    icon:     [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple:    '/favicon.svg',
    shortcut: '/favicon.svg',
  },

  // PWA manifest
  manifest: '/manifest.json',

  // Open Graph — WhatsApp, Facebook, LinkedIn previews
  openGraph: {
    type:        'website',
    locale:      'en_NG',
    url:         APP_URL,
    siteName:    'NaijaVote',
    title:       "NaijaVote — Know Who You're Voting For",
    description: 'Research Nigerian election candidates, compare manifestos, check track records and make an informed vote for the 2027 general elections.',
    images: [
      {
        url:    '/og-image.svg',
        width:  1200,
        height: 630,
        alt:    "NaijaVote — Know Who You're Voting For — Nigeria 2027 Elections",
      },
    ],
  },

  // Twitter / X card
  twitter: {
    card:        'summary_large_image',
    title:       'NaijaVote — Know Your Candidate Nigeria',
    description: 'Research candidates, compare manifestos and make an informed vote for the 2027 Nigerian general elections.',
    images:      ['/og-image.svg'],
    creator:     '@NaijaVoteNG',
    site:        '@NaijaVoteNG',
  },

  // SEO
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor:    '#006400',
  colorScheme:   'light',
  width:         'device-width',
  initialScale:  1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning required for next-themes to avoid flash on load
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
