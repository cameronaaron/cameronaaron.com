import { Atkinson_Hyperlegible_Next, Newsreader } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import SmoothScroll from "@/components/ui/SmoothScroll";
import IframeTitleGuard from "@/components/ui/IframeTitleGuard";
import MotionProvider from "@/components/ui/MotionProvider";
import { buildRootMetadata, buildRootViewport, SPECULATION_RULES } from "@/data/metadata";

// Body: Atkinson Hyperlegible Next, drawn by the Braille Institute so that
// similar letterforms stay distinguishable. It is on every route's first
// paint, so it is the one font the layout preloads.
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  // next/font has no metrics table for this family yet (the build warns
  // "Failed to find font override values" and skips the size-adjusted
  // fallback), so say so explicitly and name the system stack to swap from.
  adjustFontFallback: false,
  fallback: ['system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

// Display: Newsreader. Not preloaded here: a layout-level preload lands on
// every route, and next/font attaches it to all of them (measured 2026-10-03).
// Routes that paint a display heading in their first viewport call
// preloadFontFiles() from ./font-preloads.
const newsreader = Newsreader({
  subsets: ["latin"],
  display: 'swap',
  preload: false,
  variable: '--font-display',
});

export const metadata = buildRootMetadata();

export const viewport = buildRootViewport();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* WebMCP discovery: lets AI agents find the tool/form manifest without parsing llms.txt */}
        <link rel="mcp" type="application/json" href="/mcp.json" />

        {/* PWA Configuration */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Instant subpage navigation: hover-prefetch + pointerdown-prerender
            of same-origin pages (see SPECULATION_RULES for the full why). */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SPECULATION_RULES) }}
        />

        <StructuredData />
      </head>
      <body className={`${atkinson.className} ${newsreader.variable}`} suppressHydrationWarning>
        <SmoothScroll />
        <ServiceWorkerRegistration />
        <IframeTitleGuard />
        <noscript>
          <div className="noscript-warning">
            This website requires JavaScript to be enabled for the best experience.
          </div>
        </noscript>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
