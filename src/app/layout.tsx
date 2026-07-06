import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import SmoothScroll from "@/components/ui/SmoothScroll";
import IframeTitleGuard from "@/components/ui/IframeTitleGuard";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://cameronaaron.com"),
  title: {
    default: "Cameron Aaron Official Site | EMT, CNA, Software Engineer",
    template: "%s | Cameron Aaron"
  },
  description: "Official website of Cameron Aaron, EMT and CNA with software engineering, security research, and graduate arts-based capstone research on thrice-exceptional Black male students in higher education transition.",
  keywords: [
    "Cameron Aaron",
    "Aaron Cameron",
    "Cameron Aaron official site",
    "Cameron Aaron portfolio",
    "Medical Resume",
    "Healthcare Resume",
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
    "Advanced Cardiovascular Life Support",
    "Pediatric Advanced Life Support",
    "Basic Life Support",
    "Neonatal Resuscitation Program",
    "Certified EKG Technician",
    "Phlebotomy",
    "Nurse Practitioner",
    "NP School",
    "Nursing Prerequisites",
    "Nursing Program Prerequisite Coursework",
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
    "Cognitive Diversity",
    "Cognitive Diversity in Education",
    "M.Ed. Cognitive Diversity",
    "Twice Exceptional Education",
    "Thrice-Exceptional",
    "Thrice-Exceptional Black Male Students",
    "Twice-Exceptional",
    "Gifted Education",
    "Higher Education Transition",
    "Higher Education Transition Support",
    "Disability Services",
    "Arts-Based Research",
    "Culturally Responsive Education",
    "Neurodiversity in Education",
    "Black Male Student Success",
    "Black Male Student Success in Higher Education",
    "Intersectionality",
    "Educational Equity",
    "Educational Video Content",
    "Capstone Research",
    "Capstone Defense",
    "Educational Research Methods",
    "Arts-Based Action Research",
    "Community Cultural Wealth",
    "Strength-Based Education",
    "Culturally Responsive Teaching",
    "Disability Services in Higher Education",
    "Educational Equity in Higher Education",
    "Black Male College Achievement",
    "Higher Education Disability Transition",
    "Institutional Training",
    "Educational Video Series"
  ],
  authors: [{ name: "Cameron Aaron, M.Ed.", url: "https://cameronaaron.com" }],
  creator: "Cameron Aaron, M.Ed.",
  publisher: "Cameron Aaron, M.Ed.",
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
  icons: {
    icon: [
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icons/icon-512x512.png",
      }
    ]
  },
  openGraph: {
    title: "Cameron Aaron, M.Ed. | EMT, CNA, Software Engineer",
    description: "Official site of Cameron Aaron, M.Ed. — healthcare credentials, software engineering work, and arts-based capstone research on thrice-exceptional Black male students and higher education transition.",
    url: "https://cameronaaron.com/",
    siteName: "Cameron Aaron",
    images: [
      {
        url: "https://cameronaaron.com/social/opengraph-image.png",
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
    title: "Cameron Aaron, M.Ed. | EMT, CNA, Software Engineer",
    description: "Official portfolio of Cameron Aaron, M.Ed. featuring healthcare credentials, technical work, and graduate arts-based research in gifted education and higher education transition.",
    images: {
      url: "https://cameronaaron.com/social/twitter-image.png",
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
    title: 'Cameron Aaron, M.Ed.',
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
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#06b6d4' },
    { media: '(prefers-color-scheme: light)', color: '#06b6d4' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  colorScheme: 'dark',
};

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
