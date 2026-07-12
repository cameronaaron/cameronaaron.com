import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import SmoothScroll from "@/components/ui/SmoothScroll";
import IframeTitleGuard from "@/components/ui/IframeTitleGuard";
import { buildRootMetadata, buildRootViewport } from "@/data/metadata";

const manrope = Manrope({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: 'swap',
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
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        <StructuredData />
      </head>
      <body className={`${manrope.className} ${spaceGrotesk.variable}`} suppressHydrationWarning>
        <SmoothScroll />
        <ServiceWorkerRegistration />
        <IframeTitleGuard />
        <noscript>
          <div className="noscript-warning">
            This website requires JavaScript to be enabled for the best experience.
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
