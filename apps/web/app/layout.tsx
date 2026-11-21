import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClipGlass — Liquid Glass Media Downloader',
  description: 'Fast, clean YouTube video & audio extraction in Apple-style liquid glass. No software, no ads, ephemeral 15-minute storage.',
  keywords: ['youtube downloader', 'audio extractor', 'liquid glass', 'mp3 converter', 'mp4 download', 'clipglass'],
  openGraph: {
    title: 'ClipGlass — Liquid Glass Media Downloader',
    description: 'Paste a link. Pick a quality. Done. Ephemeral, ad-free media workflow.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E9ECF3' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0E1A' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Poppins:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="relative min-h-[100dvh] bg-canvas-light dark:bg-canvas-dark text-ink-primary dark:text-ink-dark-primary antialiased selection:bg-primaryAction-start/20 selection:text-primaryAction-middle overflow-x-hidden">
        {/* Soft Radial Ambient Blobs with Fluid Drifting Animation */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Top-Left Electric Blue & Cyan Nebula */}
          <div className="fluid-blob-lavender absolute -top-[15%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#E4E1F7]/75 dark:bg-gradient-to-br dark:from-[#0055FF]/40 dark:via-[#0099FF]/25 dark:to-[#00D2FF]/15 blur-[120px]" />
          {/* Bottom-Right Violet & Magenta Nebula */}
          <div className="fluid-blob-iceblue absolute -bottom-[15%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[#DDEBFA]/75 dark:bg-gradient-to-tl dark:from-[#7C3AED]/45 dark:via-[#9333EA]/30 dark:to-[#C026D3]/20 blur-[130px]" />
          {/* Center Deep Midnight Indigo Haze */}
          <div className="hidden dark:block absolute top-[25%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-[#1E1B4B]/50 blur-[100px]" />
        </div>

        {/* Global Script for dynamic mouse highlight and theme init */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('clipglass_theme');
                  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
                try {
                  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js');
                    });
                  }
                } catch(e) {}
              })();
            `,
          }}
        />

        {children}
      </body>
    </html>
  );
}

