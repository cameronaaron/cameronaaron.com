/**
 * Image Metadata Helper
 * Generates schema.org ImageObject with EXIF and licensing information
 */

export interface ImageMetadata {
  url: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  creator?: string;
  copyrightNotice?: string;
  license?: string;
  creditText?: string;
}

export function generateImageSchema(image: ImageMetadata) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "contentUrl": image.url,
    "url": image.url,
    "width": image.width,
    "height": image.height,
    "caption": image.caption || image.alt,
    "description": image.alt,
    "creator": image.creator ? {
      "@type": "Person",
      "name": image.creator
    } : undefined,
    "copyrightNotice": image.copyrightNotice,
    "license": image.license,
    "creditText": image.creditText,
    "acquireLicensePage": image.license,
  };
}

// Main portfolio images with metadata
export const portfolioImages: ImageMetadata[] = [
  {
    url: "https://cameronaaron.com/profile.webp",
    width: 400,
    height: 400,
    alt: "Cameron E. Aaron - Software Engineer & Neuroscientist",
    caption: "Professional headshot of Cameron E. Aaron",
    creator: "Cameron E. Aaron",
    copyrightNotice: "© 2025 Cameron E. Aaron. All rights reserved.",
    creditText: "Cameron E. Aaron"
  },
  {
    url: "https://cameronaaron.com/ba.webp",
    width: 40,
    height: 40,
    alt: "Bridges Academy Logo",
    caption: "Bridges Academy - Educational Institution",
    copyrightNotice: "© Bridges Academy"
  },
  {
    url: "https://cameronaaron.com/Dutchie.svg",
    width: 40,
    height: 40,
    alt: "Dutchie Logo",
    caption: "Dutchie - Cannabis Technology Company",
    copyrightNotice: "© Dutchie"
  },
  {
    url: "https://cameronaaron.com/spacex.webp",
    width: 40,
    height: 40,
    alt: "SpaceX Logo",
    caption: "SpaceX - Aerospace Manufacturer",
    copyrightNotice: "© SpaceX"
  },
  {
    url: "https://cameronaaron.com/github.webp",
    width: 40,
    height: 40,
    alt: "GitHub Logo",
    caption: "GitHub - Software Development Platform",
    copyrightNotice: "© GitHub, Inc."
  },
  {
    url: "https://cameronaaron.com/google.webp",
    width: 40,
    height: 40,
    alt: "Google Logo",
    caption: "Google - Technology Company",
    copyrightNotice: "© Google LLC"
  }
];

export function getAllImageSchemas() {
  return portfolioImages.map(generateImageSchema);
}
