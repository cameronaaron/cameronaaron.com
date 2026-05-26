import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import SmoothScroll from "@/components/ui/SmoothScroll";

const manrope = Manrope({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-display',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cameronaaron.com"),
  title: {
    default: "Cameron Aaron Official Site | EMT, CNA, Software Engineer",
    template: "%s | Cameron Aaron"
  },
  description: "Official website of Cameron Aaron, EMT and CNA with software engineering and security research experience. Explore credentials, experience, publications, and contact details.",
  keywords: [
    "Cameron Aaron",
    "Aaron Cameron",
    "Cameron Aaron official site",
    "Cameron Aaron portfolio",
    "Software Engineer",
    "Security Researcher",
    "Cybersecurity",
    "DevOps",
    "Cloud Engineering",
    "AI Engineer",
    "Machine Learning",
    "Full-Stack Developer",
    "Python Developer",
    "TypeScript Developer",
    "React Developer",
    "Next.js Developer",
    "Systems Administrator",
    "Bioinformatics",
    "EMT",
    "CNA",
    "Nurse Practitioner",
    "NP School",
    "Nursing Prerequisites",
    "Aerospace Medicine",
    "Healthcare Technology",
    "Clinical Research",
    "Biopsychology",
    "Neuroscience",
    "Public Health Operations",
    "Emergency Medical Technician",
    "Patient-Centered Care",
    "Community Health Worker",
    "Clinical Data Analysis",
    "Medical Imaging",
    "EEG Research",
    "Cognitive Diversity"
  ],
  authors: [{ name: "Cameron Aaron", url: "https://cameronaaron.com" }],
  creator: "Cameron Aaron",
  publisher: "Cameron Aaron",
  alternates: {
    canonical: "https://cameronaaron.com/",
    languages: {
      'en-US': '/',
      'en': '/',
    },
    types: {
      'application/rss+xml': 'https://cameronaaron.com/feed.xml',
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icon-512x512.png",
      }
    ]
  },
  openGraph: {
    title: "Cameron Aaron Official Site | EMT, CNA, Software Engineer",
    description: "Official Cameron Aaron portfolio with credentials, clinical-care experience, security research, and software engineering work.",
    url: "https://cameronaaron.com/",
    siteName: "Cameron Aaron",
    images: [
      {
        url: "https://cameronaaron.com/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Cameron Aaron | EMT, CNA, Software Engineer, Security Researcher & Future NP",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "profile",
    firstName: "Cameron",
    lastName: "Aaron",
    username: "cameronaaron",
    gender: "male",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cameron Aaron Official Site | EMT, CNA, Software Engineer",
    description: "Official portfolio of Cameron Aaron featuring healthcare credentials, experience, projects, and contact information.",
    images: {
      url: "https://cameronaaron.com/twitter-image.png",
      alt: "Cameron Aaron | EMT, CNA, Software Engineer, Security Researcher & Future NP",
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'healthcare and technology',
  classification: 'Professional Resume Website',
  applicationName: 'Cameron Aaron Medical Resume',
  referrer: 'origin-when-cross-origin',
  appleWebApp: {
    capable: true,
    title: 'Cameron Aaron',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
    email: true,
    address: false,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? {
          'msvalidate.01': process.env.BING_SITE_VERIFICATION,
        }
      : undefined,
  },
  other: {
    'geo.region': 'US-CA',
    'geo.placename': 'Los Angeles',
    'ICBM': '34.0522, -118.2437',
    'theme-color': '#06b6d4',
  },
};

export const viewport = {
  themeColor: "#06b6d4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* DNS Prefetch and Preconnect for performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Critical resource preload */}
        <link rel="preload" href="/profile.webp" as="image" type="image/webp" fetchPriority="high" />
        <link rel="prefetch" href="/icon-192x192.png" as="image" />
        
        {/* PWA Configuration */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Security Headers (X-Frame-Options set via middleware) */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* Performance Hints */}
        <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width" />
        
        <StructuredData />
      </head>
      <body className={`${manrope.className} ${spaceGrotesk.variable}`} suppressHydrationWarning>
        <SmoothScroll />
        <ServiceWorkerRegistration />
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
