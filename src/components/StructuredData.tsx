import { profile } from '@/data/profile';
import { experiences } from '@/data/experience';
import { projects } from '@/data/projects';
import { skills } from '@/data/skills';
import { certifications } from '@/data/certifications';
import { testimonials } from '@/data/testimonials';
import { faqs } from '@/data/faqs';
import { educationItems } from '@/data/education';
import { sortByDateDesc } from '@/data/dateOrdering';

function toIsoDate(monthYearText?: string): string | undefined {
  if (!monthYearText) return undefined;

  const parsed = new Date(`${monthYearText} 01`);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toISOString().slice(0, 10);
}

function splitPeriod(period?: string): { startDate?: string; endDate?: string } {
  if (!period) return {};

  const [startText, endText] = period.split(' - ').map((segment) => segment.trim());
  return {
    startDate: toIsoDate(startText),
    endDate: toIsoDate(endText),
  };
}

export default function StructuredData() {
  const sortedProjects = sortByDateDesc(projects, (project) => project.period);
  const sortedCertifications = sortByDateDesc(certifications, (certification) => certification.status);
  const sortedTestimonials = sortByDateDesc(testimonials, (testimonial) => testimonial.date);
  const researchThemes = Array.from(new Set(sortedProjects.flatMap((project) => project.tags)));
  const roleNames = Array.from(
    new Set(
      experiences.flatMap((exp) => exp.positions.map((position) => position.title).filter(Boolean))
    )
  ) as string[];

  const baseUrl = 'https://cameronaaron.com';
  const capstoneUrl = `${baseUrl}/capstone.html`;
  const personId = `${baseUrl}/#person`;
  const websiteId = `${baseUrl}/#website`;
  const webpageId = `${baseUrl}/#webpage`;

  const personSchema = {
    "@type": "Person",
    "@id": personId,
    name: profile.name,
    alternateName: ['Aaron Cameron'],
    givenName: 'Cameron',
    familyName: 'Aaron',
    jobTitle: profile.title,
    description: profile.bio,
    image: `${baseUrl}${profile.image}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: profile.location,
    },
    email: profile.email,
    url: baseUrl,
    sameAs: [
      profile.social.github,
      profile.social.linkedin,
    ],
    alumniOf: educationItems.map((item) => ({
      "@type": 'CollegeOrUniversity',
      name: item.institution,
    })),
    hasOccupation: roleNames.slice(0, 12).map((roleName) => ({
      "@type": 'Occupation',
      name: roleName,
    })),
    knowsAbout: Array.from(new Set([...skills.domains, ...researchThemes])).slice(0, 30),
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: profile.email,
        contactType: 'professional inquiries',
        availableLanguage: ['en'],
      },
    ],
    hasCredential: certifications.map((cert) => ({
      "@type": "EducationalOccupationalCredential",
      name: cert.name,
      credentialCategory: cert.status.toLowerCase(),
      recognizedBy: {
        "@type": "Organization",
        name: cert.issuer,
      },
      identifier: cert.credentialId,
    })),
  };

  const profilePageSchema = {
    "@type": "ProfilePage",
    "@id": webpageId,
    url: baseUrl,
    name: `${profile.name} | Profile`,
    inLanguage: 'en-US',
    isPartOf: { "@id": websiteId },
    mainEntity: { "@id": personId },
  };

  const websiteSchema = {
    "@type": "WebSite",
    "@id": websiteId,
    url: baseUrl,
    name: `${profile.name} Portfolio`,
    inLanguage: 'en-US',
    publisher: { "@id": personId },
  };

  const webPageSchema = {
    "@type": "WebPage",
    "@id": `${baseUrl}/#home-page`,
    url: baseUrl,
    name: `${profile.name} Portfolio`,
    isPartOf: { "@id": websiteId },
    about: { "@id": personId },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${baseUrl}${profile.image}`,
    },
    hasPart: [
      {
        "@type": 'WebPage',
        "@id": `${capstoneUrl}#webpage`,
        url: capstoneUrl,
        name: 'Bridging Transitions Capstone Defense',
      },
    ],
    inLanguage: 'en-US',
  };

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
    ],
  };

  const educationSchema = {
    "@type": 'ItemList',
    name: 'Education',
    itemListElement: educationItems.map((item, index) => ({
      "@type": 'ListItem',
      position: index + 1,
      item: {
        "@type": 'EducationalOccupationalCredential',
        name: item.credential,
        credentialCategory: item.credential.toLowerCase().includes('certificate') ? 'certificate' : 'degree',
        recognizedBy: {
          "@type": 'CollegeOrUniversity',
          name: item.institution,
        },
        description: item.details.join(' '),
      },
    })),
  };

  const faqPageSchema = {
    "@type": 'FAQPage',
    "@id": `${baseUrl}/#faq`,
    name: 'Frequently Asked Questions',
    mainEntity: faqs.map((faq) => ({
      "@type": 'Question',
      name: faq.question,
      acceptedAnswer: {
        "@type": 'Answer',
        text: faq.answer,
      },
    })),
  };

  const researchOutputSchema = {
    "@type": "ItemList",
    name: 'Research and Publications',
    itemListElement: sortedProjects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": project.link.includes('/capstone') ? 'ScholarlyArticle' : 'CreativeWork',
        name: project.title,
        ...(project.link.includes('/capstone')
          ? {
              author: {
                "@id": personId,
              },
              isAccessibleForFree: true,
              educationalUse: 'Professional development and institutional training',
            }
          : {}),
        description: project.description,
        url: project.link,
        keywords: project.tags.join(', '),
        ...(toIsoDate(project.period) ? { datePublished: toIsoDate(project.period) } : {}),
      },
    })),
  };

  const workExperienceSchema = {
    "@type": "ItemList",
    name: 'Professional Experience',
    itemListElement: experiences.map((exp, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "OrganizationRole",
        roleName: exp.positions[0]?.title,
        worksFor: {
          "@type": "Organization",
          name: exp.company,
        },
        ...(splitPeriod(exp.positions[0]?.period).startDate
          ? { startDate: splitPeriod(exp.positions[0]?.period).startDate }
          : {}),
        ...(splitPeriod(exp.positions[0]?.period).endDate
          ? { endDate: splitPeriod(exp.positions[0]?.period).endDate }
          : {}),
      },
    })),
  };

  const credentialSchema = {
    "@type": "ItemList",
    name: 'Certifications and Credentials',
    itemListElement: sortedCertifications.map((cert, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "EducationalOccupationalCredential",
        name: cert.name,
        credentialCategory: cert.status.toLowerCase(),
        recognizedBy: {
          "@type": "Organization",
          name: cert.issuer,
        },
        identifier: cert.credentialId,
      },
    })),
  };

  const testimonialSchema = {
    "@type": "ItemList",
    name: 'Professional Testimonials',
    itemListElement: sortedTestimonials.slice(0, 12).map((testimonial, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": 'CreativeWork',
        name: `Testimonial from ${testimonial.name}`,
        text: testimonial.text,
        ...(toIsoDate(testimonial.date) ? { datePublished: toIsoDate(testimonial.date) } : {}),
        creator: {
          "@type": 'Person',
          name: testimonial.name,
          jobTitle: testimonial.role,
        },
      },
    })),
  };

  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      personSchema,
      websiteSchema,
      webPageSchema,
      profilePageSchema,
      breadcrumbSchema,
      educationSchema,
      faqPageSchema,
      researchOutputSchema,
      workExperienceSchema,
      credentialSchema,
      testimonialSchema,
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />
    </>
  );
}
