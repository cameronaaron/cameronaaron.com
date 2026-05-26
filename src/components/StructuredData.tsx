import { profile } from '@/data/profile';
import { experiences } from '@/data/experience';
import { projects } from '@/data/projects';
import { skills } from '@/data/skills';
import { certifications } from '@/data/certifications';

export default function StructuredData() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title,
    description: profile.bio,
    image: `https://cameronaaron.com${profile.image}`,
    email: profile.email,
    url: "https://cameronaaron.com",
    sameAs: [
      profile.social.github,
      profile.social.linkedin,
    ],
    knowsAbout: skills.domains,
    hasCredential: certifications.map((cert) => ({
      "@type": "EducationalOccupationalCredential",
      name: cert.name,
      credentialCategory: cert.status,
      recognizedBy: {
        "@type": "Organization",
        name: cert.issuer,
      },
      identifier: cert.credentialId,
    })),
  };

  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.name,
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cameron Aaron",
    url: "https://cameronaaron.com",
    logo: "https://cameronaaron.com/icon-512x512.png",
    sameAs: [
      profile.social.github,
      profile.social.linkedin,
    ],
    contactPoint: [{
      "@type": "ContactPoint",
      email: profile.email,
      contactType: "professional inquiries"
    }],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://cameronaaron.com",
      },
    ],
  };

  const researchOutputSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: projects.map((project, index) => ({
      "@type": "CreativeWork",
      position: index + 1,
      name: project.title,
      description: project.description,
      datePublished: project.period,
      url: project.link,
    })),
  };

  const workExperienceSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: experiences.map((exp, index) => ({
      "@type": "OrganizationRole",
      position: index + 1,
      roleName: exp.positions[0]?.title,
      startDate: exp.positions[0]?.period,
      organization: {
        "@type": "Organization",
        name: exp.company,
      },
    })),
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Cameron Aaron Medical Resume",
    url: "https://cameronaaron.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://cameronaaron.com/?s={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(researchOutputSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(workExperienceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
