import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://cameronaaron.com"),
  title: {
    default: "Cameron E. Aaron - Software Engineer & Neuroscientist",
    template: "%s | Cameron E. Aaron"
  },
  description: "Seasoned Product Manager and Software Engineer with expertise in AI, neuroscience, and aerospace medicine. Experience at GitHub, SpaceX, Dutchie, and Microsoft.",
  keywords: [
    "Cameron E. Aaron", 
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
  authors: [{ name: "Cameron E. Aaron", url: "https://cameronaaron.com" }],
  creator: "Cameron E. Aaron",
  publisher: "Cameron E. Aaron",
  alternates: {
    canonical: "https://cameronaaron.com",
    types: {
      'application/rss+xml': 'https://cameronaaron.com/feed.xml',
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/profile.webp", sizes: "400x400", type: "image/webp" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [
      { url: "/profile.webp", sizes: "400x400", type: "image/webp" }
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/profile.webp",
      }
    ]
  },
  openGraph: {
    title: "Cameron E. Aaron - Software Engineer & Neuroscientist",
    description: "Seasoned Product Manager and Software Engineer with expertise in AI, neuroscience, and aerospace medicine. Building innovative solutions at the intersection of technology and science.",
    url: "https://cameronaaron.com",
    siteName: "Cameron E. Aaron Portfolio",
    images: [
      {
        url: "/profile.webp",
        width: 1200,
        height: 630,
        alt: "Cameron E. Aaron - Software Engineer & Neuroscientist",
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
    title: "Cameron E. Aaron - Software Engineer & Neuroscientist",
    description: "Seasoned Product Manager and Software Engineer with expertise in AI, neuroscience, and aerospace medicine.",
    creator: "@cameronaaron4",
    site: "@cameronaaron4",
    images: {
      url: "/profile.webp",
      alt: "Cameron E. Aaron - Software Engineer & Neuroscientist",
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
  applicationName: 'Cameron E. Aaron Portfolio',
  referrer: 'origin-when-cross-origin',
  appleWebApp: {
    capable: true,
    title: 'Cameron E. Aaron',
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
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <StructuredData />
      </head>
      <body className={inter.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}
