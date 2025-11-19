import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import SmoothScroll from "@/components/ui/SmoothScroll";
import CustomCursor from "@/components/ui/CustomCursor";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cameronaaron.com"),
  title: {
    default: "Cameron Aaron - Software Engineer & Neuroscientist",
    template: "%s | Cameron Aaron"
  },
  description: "Seasoned Product Manager and Software Engineer with expertise in AI, neuroscience, and aerospace medicine. Experience at GitHub, SpaceX, Dutchie, and Microsoft.",
  keywords: [
    "Cameron Aaron", 
    "Software Engineer", 
    "Neuroscientist", 
    "DevOps", 
    "AI Engineer",
    "Machine Learning Expert",
    "GitHub Developer", 
    "SpaceX Engineer", 
    "Dutchie", 
    "Microsoft", 
    "Cybersecurity Expert",
    "Product Manager",
    "Full-Stack Developer",
    "Python Developer",
    "TypeScript Developer",
    "React Developer",
    "Next.js Developer",
    "Cloud Architect",
    "AWS Certified",
    "Google Cloud Certified",
    "Biopsychology Teacher",
    "IT Director",
    "Systems Administrator",
    "FastAPI Developer",
    "AI Research",
    "Bioinformatics",
    "Aerospace Medicine",
    "Education Technology"
  ],
  authors: [{ name: "Cameron Aaron", url: "https://cameronaaron.com" }],
  creator: "Cameron Aaron",
  publisher: "Cameron Aaron",
  alternates: {
    canonical: "https://cameronaaron.com",
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
    title: "Cameron Aaron - Software Engineer & Neuroscientist",
    description: "Seasoned Product Manager and Software Engineer with expertise in AI, neuroscience, and aerospace medicine. Building innovative solutions at the intersection of technology and science.",
    url: "https://cameronaaron.com",
    siteName: "Cameron Aaron Portfolio",
    images: [
      {
        url: "https://cameronaaron.com/profile.webp",
        width: 1200,
        height: 630,
        alt: "Cameron Aaron - Software Engineer & Neuroscientist",
        type: "image/webp",
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
    title: "Cameron Aaron - Software Engineer & Neuroscientist",
    description: "Seasoned Product Manager and Software Engineer with expertise in AI, neuroscience, and aerospace medicine.",
    images: {
      url: "https://cameronaaron.com/profile.webp",
      alt: "Cameron Aaron - Software Engineer & Neuroscientist",
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
  category: 'technology',
  classification: 'Portfolio Website',
  applicationName: 'Cameron Aaron Portfolio',
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
    // Add your verification codes when you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // other: 'your-other-verification-code',
  },
};

export const viewport = {
  themeColor: "#7c3aed",
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
      <body className={inter.className} suppressHydrationWarning>
        <SmoothScroll />
        <CustomCursor />
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
