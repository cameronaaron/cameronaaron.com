import { profile } from '@/data/profile';
import { experiences } from '@/data/experience';
import { projects } from '@/data/projects';
import { skills } from '@/data/skills';
import { testimonials } from '@/data/testimonials';
import { faqs } from '@/data/faqs';
import { getAllImageSchemas } from '@/utils/imageMetadata';

/**
 * Comprehensive Structured Data (Schema.org JSON-LD) for Google Rich Results
 * Implements: Person, Organization, ProfilePage, BreadcrumbList, ItemList (Projects),
 * EducationalOccupationalCredential, Review, FAQ, ImageObject, and SoftwareApplication schemas
 */
export default function StructuredData() {
  // Person Schema - Main profile information
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://cameronaaron.com/#person",
    "name": "Cameron E. Aaron",
    "givenName": "Cameron",
    "familyName": "Aaron",
    "additionalName": "E.",
    "url": "https://cameronaaron.com",
    "image": {
      "@type": "ImageObject",
      "url": "https://cameronaaron.com/profile.webp",
      "width": 400,
      "height": 400,
      "caption": "Cameron E. Aaron - Software Engineer & Neuroscientist"
    },
    "jobTitle": [
      "Software Engineer",
      "Neuroscientist", 
      "Product Manager",
      "DevOps Engineer",
      "Director of Information Technology Engineering"
    ],
    "description": profile.bio,
    "email": "mailto:cameronthescientist@pm.me",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Los Angeles",
      "addressRegion": "CA",
      "addressCountry": "US"
    },
    "sameAs": [
      "https://github.com/cameronaaron",
      "https://www.linkedin.com/in/kamisama",
      "https://twitter.com/cameronaaron4",
      "https://linktr.ee/cameronaaron"
    ],
    "knowsAbout": [
      "Artificial Intelligence",
      "Machine Learning",
      "Neuroscience",
      "Biopsychology",
      "Software Engineering",
      "DevOps",
      "Cloud Computing",
      "Cybersecurity",
      "Product Management",
      "Aerospace Medicine",
      "Bioinformatics",
      "Education Technology",
      ...skills.technical.map(s => s.name)
    ],
    "knowsLanguage": [
      {
        "@type": "Language",
        "name": "English",
        "alternateName": "en"
      }
    ],
    "hasCredential": skills.certifications.map(cert => ({
      "@type": "EducationalOccupationalCredential",
      "name": cert,
      "credentialCategory": "Professional Certificate"
    })),
    "worksFor": experiences.slice(0, 1).map(exp => ({
      "@type": "Organization",
      "name": exp.company,
      "url": exp.company === "Bridges Academy" ? "https://bridges.edu" : undefined
    }))[0],
    "alumniOf": [
      {
        "@type": "EducationalOrganization",
        "name": "University of California, Berkeley",
        "url": "https://www.berkeley.edu",
        "sameAs": "https://www.berkeley.edu"
      },
      {
        "@type": "EducationalOrganization", 
        "name": "Connecticut College",
        "url": "https://www.conncoll.edu"
      }
    ],
    "award": [
      "2021 Ammerman Center Bridget Baird Award for Genetic RefleXions Magic Mirror",
      "Google Code-in Grand Prize Winner",
      "Multiple Hackathon Winner",
      "Academic Excellence Awards"
    ],
    "memberOf": [
      {
        "@type": "Organization",
        "name": "GitHub",
        "url": "https://github.com"
      }
    ],
    "affiliation": experiences.map(exp => ({
      "@type": "Organization",
      "name": exp.company
    }))
  };

  // ProfilePage Schema
  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": "https://cameronaaron.com/#profilepage",
    "mainEntity": {
      "@id": "https://cameronaaron.com/#person"
    },
    "name": "Cameron E. Aaron - Professional Portfolio",
    "description": "Professional portfolio showcasing experience in software engineering, neuroscience, AI, and product management",
    "url": "https://cameronaaron.com",
    "dateCreated": "2020-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "inLanguage": "en-US"
  };

  // WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://cameronaaron.com/#website",
    "name": "Cameron E. Aaron Portfolio",
    "url": "https://cameronaaron.com",
    "description": profile.bio,
    "publisher": {
      "@id": "https://cameronaaron.com/#person"
    },
    "inLanguage": "en-US",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://cameronaaron.com/?s={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://cameronaaron.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Experience",
        "item": "https://cameronaaron.com#experience"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Projects",
        "item": "https://cameronaaron.com#projects"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Skills",
        "item": "https://cameronaaron.com#skills"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Contact",
        "item": "https://cameronaaron.com#contact"
      }
    ]
  };

  // ItemList Schema for Projects
  const projectsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Cameron E. Aaron - Portfolio Projects",
    "description": "Innovative software projects leveraging AI, web development, and scientific research",
    "numberOfItems": projects.length,
    "itemListElement": projects.map((project, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "SoftwareApplication",
        "name": project.title,
        "description": project.description,
        "url": project.link,
        "applicationCategory": "WebApplication",
        "keywords": project.tags.join(", "),
        "author": {
          "@id": "https://cameronaaron.com/#person"
        },
        "datePublished": project.period.includes("2024") ? "2024-04-01" : 
                        project.period.includes("2023") ? "2023-08-01" :
                        project.period.includes("2021") ? "2021-05-01" : "2023-01-01",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      }
    }))
  };

  // Review Schema from Testimonials (using aggregate rating pattern)
  const reviewSchema = testimonials.filter(t => t.featured).map((testimonial, index) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "@id": `https://cameronaaron.com/#review-${index}`,
    "itemReviewed": {
      "@id": "https://cameronaaron.com/#person"
    },
    "author": {
      "@type": "Person",
      "name": testimonial.name,
      "jobTitle": testimonial.role,
      "worksFor": testimonial.company ? {
        "@type": "Organization",
        "name": testimonial.company
      } : undefined
    },
    "reviewBody": testimonial.text,
    "datePublished": new Date(testimonial.date).toISOString().split('T')[0],
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "5",
      "bestRating": "5",
      "worstRating": "1"
    }
  }));

  // Organization Schema for current employer
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://cameronaaron.com/#organization",
    "name": "Cameron E. Aaron",
    "url": "https://cameronaaron.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://cameronaaron.com/profile.webp",
      "width": 400,
      "height": 400
    },
    "description": "Professional software engineering and consulting services",
    "founder": {
      "@id": "https://cameronaaron.com/#person"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "cameronthescientist@pm.me",
      "contactType": "Professional Inquiries",
      "availableLanguage": ["English"]
    },
    "sameAs": [
      "https://github.com/cameronaaron",
      "https://www.linkedin.com/in/kamisama",
      "https://twitter.com/cameronaaron4"
    ]
  };

  // Work Experience as ItemList
  const workExperienceSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Professional Experience",
    "description": "Cameron E. Aaron's work experience at leading technology companies",
    "numberOfItems": experiences.length,
    "itemListElement": experiences.flatMap((exp, expIndex) => 
      exp.positions.map((pos, posIndex) => ({
        "@type": "ListItem",
        "position": expIndex * 10 + posIndex + 1,
        "item": {
          "@type": "OrganizationRole",
          "roleName": pos.title,
          "description": pos.description,
          "startDate": pos.period.split(' - ')[0].includes('2020') ? '2020-08-01' : 
                       pos.period.split(' - ')[0].includes('2021') ? '2021-08-01' :
                       pos.period.split(' - ')[0].includes('2022') ? '2022-11-01' :
                       pos.period.split(' - ')[0].includes('2023') ? '2023-03-01' : '2019-08-01',
          "endDate": pos.period.includes('Present') ? undefined : 
                    pos.period.includes('2022') ? '2022-11-01' :
                    pos.period.includes('2020') ? '2020-12-01' : '2022-02-01',
          "memberOf": {
            "@type": "Organization",
            "name": exp.company,
            "logo": `https://cameronaaron.com${exp.logo}`
          }
        }
      }))
    )
  };

  // Educational Credentials Schema
  const educationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Educational Credentials & Certifications",
    "numberOfItems": skills.certifications.length,
    "itemListElement": skills.certifications.map((cert, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "EducationalOccupationalCredential",
        "name": cert,
        "credentialCategory": "Professional Certificate",
        "recognizedBy": {
          "@type": "Organization",
          "name": cert.includes("Google") ? "Google" : cert.includes("AWS") ? "Amazon Web Services" : "edX"
        }
      }
    }))
  };

  // FAQ Schema for rich results
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  // HowTo Schema for getting in touch
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Contact Cameron E. Aaron",
    "description": "Steps to get in touch with Cameron E. Aaron for professional inquiries",
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": "Visit the Contact Section",
        "text": "Navigate to the contact section at https://cameronaaron.com#contact",
        "url": "https://cameronaaron.com#contact"
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": "Choose Your Contact Method",
        "text": "Select from email, GitHub, LinkedIn, or Twitter to reach out"
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": "Send Your Message",
        "text": "For professional inquiries, email cameronthescientist@pm.me with details about your project or opportunity"
      }
    ]
  };

  // Image metadata schemas
  const imageSchemas = getAllImageSchemas();

  // Skills as DefinedTermSet
  const skillsTermSetSchema = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "name": "Technical Skills",
    "description": "Technical skills and expertise of Cameron E. Aaron",
    "hasDefinedTerm": skills.technical.map(skill => ({
      "@type": "DefinedTerm",
      "name": skill.name,
      "description": `${skill.level}% proficiency in ${skill.name}`
    }))
  };

  // Combine all schemas
  const allSchemas = [
    personSchema,
    profilePageSchema,
    websiteSchema,
    breadcrumbSchema,
    projectsSchema,
    organizationSchema,
    workExperienceSchema,
    educationSchema,
    faqSchema,
    howToSchema,
    skillsTermSetSchema,
    ...reviewSchema,
    ...imageSchemas
  ];

  return (
    <>
      {allSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
