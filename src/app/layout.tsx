import { Bricolage_Grotesque, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import SmoothScroll from "@/components/ui/SmoothScroll";
import IframeTitleGuard from "@/components/ui/IframeTitleGuard";
import MotionProvider from "@/components/ui/MotionProvider";
import { buildRootMetadata, buildRootViewport, SPECULATION_RULES } from "@/data/metadata";

const manrope = Manrope({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-display',
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-mono-accent',
  weight: ['400', '500'],
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
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Instant subpage navigation: hover-prefetch + pointerdown-prerender
            of same-origin pages (see SPECULATION_RULES for the full why). */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SPECULATION_RULES) }}
        />

        <StructuredData />
      </head>
      <body className={`${manrope.className} ${bricolage.variable} ${geistMono.variable}`} suppressHydrationWarning>
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
