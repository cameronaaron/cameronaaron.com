import { profile } from '@/data/profile';
import { experiences } from '@/data/experience';
import { projects } from '@/data/projects';
import { skills } from '@/data/skills';
import { certifications } from '@/data/certifications';
import { testimonials } from '@/data/testimonials';
import { faqs } from '@/data/faqs';
import { educationItems } from '@/data/education';
import { sortByDateDesc } from '@/data/dateOrdering';

export function toIsoDate(monthYearText?: string): string | undefined {
  if (!monthYearText) return undefined;

  const normalized = monthYearText.trim();
  if (!/^[A-Za-z]{3,9}\s+\d{4}$/.test(normalized)) return undefined;

  const parsed = new Date(`${normalized} 01`);
  return parsed.toISOString().slice(0, 10);
}

export function splitPeriod(period?: string): { startDate?: string; endDate?: string } {
  if (!period) return {};

  const [startText, endText] = period.split(' - ').map((segment) => segment.trim());
  return {
    startDate: toIsoDate(startText),
    endDate: toIsoDate(endText),
  };
}

export function buildStructuredDataGraph(baseUrl = 'https://cameronaaron.com') {
  const sortedProjects = sortByDateDesc(projects, (project) => project.period);
  const sortedCertifications = sortByDateDesc(certifications, (certification) => certification.status);
  const sortedTestimonials = sortByDateDesc(testimonials, (testimonial) => testimonial.date);
  const researchThemeSet = new Set<string>();
  for (const project of sortedProjects) {
    for (const tag of project.tags) {
      researchThemeSet.add(tag);
    }
  }
  const researchThemes = Array.from(researchThemeSet);
  const roleNameSet = new Set<string>();
  for (const exp of experiences) {
    for (const position of exp.positions) {
      if (position.title) roleNameSet.add(position.title);
    }
  }
  const roleNames = Array.from(roleNameSet);

  const capstoneUrl = `${baseUrl}/capstone`;
  const credentialsUrl = `${baseUrl}/credentials`;
  const internetUrl = `${baseUrl}/internet`;
  const personId = `${baseUrl}/#person`;
  const websiteId = `${baseUrl}/#website`;
  const webpageId = `${baseUrl}/#webpage`;

  const personSchema = {
    '@type': 'Person',
    '@id': personId,
    name: profile.name,
    alternateName: ['Aaron Cameron'],
    givenName: 'Cameron',
    familyName: 'Aaron',
    jobTitle: profile.title,
    description: profile.bio,
    image: `${baseUrl}${profile.image}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.location,
    },
    email: profile.email,
    url: baseUrl,
    sameAs: [profile.social.github, profile.social.linkedin],
    alumniOf: educationItems.map((item) => ({
      '@type': 'CollegeOrUniversity',
      name: item.institution,
    })),
    hasOccupation: roleNames.slice(0, 12).map((roleName) => ({
      '@type': 'Occupation',
      name: roleName,
    })),
    knowsAbout: Array.from(new Set([...skills.domains, ...researchThemes])).slice(0, 30),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: profile.email,
        contactType: 'professional inquiries',
        availableLanguage: ['en'],
      },
    ],
    hasCredential: certifications.map((cert) => ({
      '@type': 'EducationalOccupationalCredential',
      name: cert.name,
      credentialCategory: cert.status.toLowerCase(),
      recognizedBy: {
        '@type': 'Organization',
        name: cert.issuer,
      },
      identifier: cert.credentialId,
    })),
  };

  const profilePageSchema = {
    '@type': 'ProfilePage',
    '@id': webpageId,
    url: baseUrl,
    name: `${profile.name} | Profile`,
    inLanguage: 'en-US',
    isPartOf: { '@id': websiteId },
    mainEntity: { '@id': personId },
  };

  const websiteSchema = {
    '@type': 'WebSite',
    '@id': websiteId,
    url: baseUrl,
    name: `${profile.name} Portfolio`,
    inLanguage: 'en-US',
    publisher: { '@id': personId },
  };

  const webPageSchema = {
    '@type': 'WebPage',
    '@id': `${baseUrl}/#home-page`,
    url: baseUrl,
    name: `${profile.name} Portfolio`,
    isPartOf: { '@id': websiteId },
    about: { '@id': personId },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${baseUrl}${profile.image}`,
    },
    hasPart: [
      {
        '@type': 'WebPage',
        '@id': `${capstoneUrl}#webpage`,
        url: capstoneUrl,
        name: 'Bridging Transitions Capstone Defense',
      },
      {
        '@type': 'WebPage',
        '@id': `${credentialsUrl}#webpage`,
        url: credentialsUrl,
        name: 'Credentials and Verification',
      },
      {
        '@type': 'WebPage',
        '@id': `${internetUrl}#webpage`,
        url: internetUrl,
        name: 'Cameron Aaron on the Internet',
      },
    ],
    inLanguage: 'en-US',
  };

  const breadcrumbSchema = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
    ],
  };

  const educationSchema = {
    '@type': 'ItemList',
    name: 'Education',
    itemListElement: educationItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'EducationalOccupationalCredential',
        name: item.credential,
        credentialCategory: item.credential.toLowerCase().includes('certificate') ? 'certificate' : 'degree',
        recognizedBy: {
          '@type': 'CollegeOrUniversity',
          name: item.institution,
        },
        description: item.details.join(' '),
      },
    })),
  };

  const faqPageSchema = {
    '@type': 'FAQPage',
    '@id': `${baseUrl}/#faq`,
    name: 'Frequently Asked Questions',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const researchOutputSchema = {
    '@type': 'ItemList',
    name: 'Research and Publications',
    itemListElement: sortedProjects.map((project, index) => {
      const isCapstone = project.link.includes('/capstone');
      const datePublished = toIsoDate(project.period);
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': isCapstone ? 'ScholarlyArticle' : 'CreativeWork',
          name: project.title,
          ...(isCapstone
            ? {
                author: {
                  '@id': personId,
                },
                isAccessibleForFree: true,
                educationalUse: 'Professional development and institutional training',
              }
            : {}),
          description: project.description,
          url: project.link,
          keywords: project.tags.join(', '),
          ...(datePublished ? { datePublished } : {}),
        },
      };
    }),
  };

  const workExperienceSchema = {
    '@type': 'ItemList',
    name: 'Professional Experience',
    itemListElement: experiences.map((exp, index) => {
      const { startDate, endDate } = splitPeriod(exp.positions[0]?.period);
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'OrganizationRole',
          roleName: exp.positions[0]?.title,
          worksFor: {
            '@type': 'Organization',
            name: exp.company,
          },
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      };
    }),
  };

  const credentialSchema = {
    '@type': 'ItemList',
    name: 'Certifications and Credentials',
    itemListElement: sortedCertifications.map((cert, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'EducationalOccupationalCredential',
        name: cert.name,
        credentialCategory: cert.status.toLowerCase(),
        recognizedBy: {
          '@type': 'Organization',
          name: cert.issuer,
        },
        identifier: cert.credentialId,
      },
    })),
  };

  const testimonialSchema = {
    '@type': 'ItemList',
    name: 'Professional Testimonials',
    itemListElement: sortedTestimonials.slice(0, 12).map((testimonial, index) => {
      const datePublished = toIsoDate(testimonial.date);
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          name: `Testimonial from ${testimonial.name}`,
          text: testimonial.text,
          ...(datePublished ? { datePublished } : {}),
          creator: {
            '@type': 'Person',
            name: testimonial.name,
            jobTitle: testimonial.role,
          },
        },
      };
    }),
  };

  return {
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
}
