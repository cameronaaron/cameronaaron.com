import { describe, expect, it } from 'vitest';

import { buildStructuredDataGraph, splitPeriod, toIsoDate } from './structured-data-builders';
import { profile } from '@/data/profile';
import { experiences } from '@/data/experience';
import { projects } from '@/data/projects';
import { skills } from '@/data/skills';
import { certifications } from '@/data/certifications';
import { testimonials } from '@/data/testimonials';
import { faqs } from '@/data/faqs';
import { educationItems } from '@/data/education';
import { sortByDateDesc } from '@/data/dateOrdering';
import { SITE_URL } from '@/data/site';

type SchemaNode = { '@type': string; [key: string]: unknown };

describe('structured data builders', () => {
  it('parses month-year text to ISO date', () => {
    expect(toIsoDate('March 2024')).toBe('2024-03-01');
    expect(toIsoDate('')).toBeUndefined();
    expect(toIsoDate('not a date')).toBeUndefined();
  });

  it('trims surrounding whitespace before validating the month-year shape', () => {
    // Guards the `.trim()` call in toIsoDate — without it, this input keeps
    // its leading/trailing spaces and fails the anchored regex, which would
    // silently swallow whitespace-padded period text from source data.
    expect(toIsoDate('  March 2024  ')).toBe('2024-03-01');
  });

  it('requires the whole string to match month-year, not just a prefix or substring', () => {
    // Anchored on both ends (^...$). Each of these guards one boundary:
    expect(toIsoDate('March 2024 extra')).toBeUndefined(); // trailing junk after the year
    expect(toIsoDate('extra March 2024')).toBeUndefined(); // leading junk before the month
    expect(toIsoDate('March2024')).toBeUndefined(); // no separating whitespace at all
  });

  it('accepts more than one whitespace character between month and year (\\s+, not \\s)', () => {
    // Guards the `+` quantifier on `\s+` specifically: with a single space
    // this input would match either `\s` or `\s+` identically, so it can't
    // distinguish the two. Two spaces only matches `\s+`.
    expect(toIsoDate('March  2024')).toBe('2024-03-01');
  });

  it('splits period into start and end dates', () => {
    expect(splitPeriod('March 2024 - April 2025')).toEqual({
      startDate: '2024-03-01',
      endDate: '2025-04-01',
    });
    expect(splitPeriod()).toEqual({});
  });

  it('trims each half of a split period before parsing', () => {
    // Guards the `.trim()` in the `.split(' - ').map(...)` chain.
    expect(splitPeriod('March 2024  -  April 2025')).toEqual({
      startDate: '2024-03-01',
      endDate: '2025-04-01',
    });
  });

  describe('buildStructuredDataGraph', () => {
    const graph = buildStructuredDataGraph();
    const nodes = graph['@graph'] as SchemaNode[];
    const byType = (type: string) => nodes.find((n) => n['@type'] === type)!;

    it('sets the schema.org context', () => {
      expect(graph['@context']).toBe('https://schema.org');
    });

    it('emits exactly the expected set of top-level @graph node types, in order', () => {
      // A single assertion pins every node's @type across the whole graph —
      // the schema.org vocabulary is part of the SEO contract, not an
      // implementation detail; a typo here breaks Rich Results validation.
      expect(nodes.map((n) => n['@type'])).toEqual([
        'Person',
        'WebSite',
        'WebPage',
        'ProfilePage',
        'BreadcrumbList',
        'ItemList', // education
        'FAQPage',
        'ItemList', // research/publications
        'ItemList', // work experience
        'ItemList', // credentials
        'ItemList', // testimonials
      ]);
    });

    it('gives every ItemList a distinct, correct name', () => {
      const itemListNames = nodes.filter((n) => n['@type'] === 'ItemList').map((n) => n.name);
      expect(itemListNames).toEqual([
        'Education',
        'Research and Publications',
        'Professional Experience',
        'Certifications and Credentials',
        'Professional Testimonials',
      ]);
    });

    describe('Person schema', () => {
      const person = byType('Person');

      it('maps identity fields directly from profile data', () => {
        expect(person.name).toBe(profile.name);
        expect(person.alternateName).toEqual(['Aaron Cameron']);
        expect(person.givenName).toBe('Cameron');
        expect(person.familyName).toBe('Aaron');
        expect(person.jobTitle).toBe(profile.title);
        expect(person.description).toBe(profile.bio);
        expect(person.email).toBe(profile.email);
        expect(person.sameAs).toEqual(Object.values(profile.social));
        expect(person.address).toEqual({ '@type': 'PostalAddress', addressLocality: profile.location });
      });

      it('maps alumniOf from every education item, preserving order', () => {
        expect(person.alumniOf).toEqual(
          educationItems.map((item) => ({ '@type': 'CollegeOrUniversity', name: item.institution }))
        );
      });

      it('caps hasOccupation at 12 deduplicated role titles', () => {
        const allTitles: string[] = [];
        const seen = new Set<string>();
        for (const exp of experiences) {
          for (const position of exp.positions) {
            if (position.title && !seen.has(position.title)) {
              seen.add(position.title);
              allTitles.push(position.title);
            }
          }
        }
        const occupation = person.hasOccupation as Array<{ name: string }>;
        expect(occupation.map((o) => o.name)).toEqual(allTitles.slice(0, 12));
        expect(occupation.length).toBeLessThanOrEqual(12);
        expect(occupation.every((o) => (o as SchemaNode)['@type'] === 'Occupation')).toBe(true);
      });

      it('caps knowsAbout at 30 deduplicated domains + research tags', () => {
        // Set insertion order depends on iterating the DATE-SORTED projects
        // (matching buildStructuredDataGraph's own sortedProjects), not
        // declaration order — a different iteration order would still
        // dedupe correctly but could produce a different final array order.
        const sortedProjects = sortByDateDesc(projects, (p) => p.period);
        const researchThemes = new Set<string>();
        for (const project of sortedProjects) {
          for (const tag of project.tags) researchThemes.add(tag);
        }
        const expected = Array.from(new Set([...skills.domains, ...Array.from(researchThemes)])).slice(0, 30);
        expect(person.knowsAbout).toEqual(expected);
        expect((person.knowsAbout as unknown[]).length).toBeLessThanOrEqual(30);
      });

      it('maps hasCredential from every certification with lowercased status', () => {
        const credentials = person.hasCredential as Array<{
          name: string;
          credentialCategory: string;
          recognizedBy: { name: string };
          identifier: unknown;
        }>;
        expect(credentials).toEqual(
          certifications.map((cert) => ({
            '@type': 'EducationalOccupationalCredential',
            name: cert.name,
            credentialCategory: cert.status.toLowerCase(),
            recognizedBy: { '@type': 'Organization', name: cert.issuer },
            identifier: cert.credentialId,
          }))
        );
        // Guards the toLowerCase()→toUpperCase() mutant directly: real data
        // must contain mixed-case status text for this to distinguish them.
        expect(certifications.some((c) => c.status !== c.status.toLowerCase())).toBe(true);
      });

      it('contactPoint is a single professional-inquiries entry', () => {
        expect(person.contactPoint).toEqual([
          { '@type': 'ContactPoint', email: profile.email, contactType: 'professional inquiries', availableLanguage: ['en'] },
        ]);
      });
    });

    describe('ProfilePage schema', () => {
      const profilePage = byType('ProfilePage');

      it('matches the full ProfilePage shape exactly', () => {
        expect(profilePage).toEqual({
          '@type': 'ProfilePage',
          '@id': `${SITE_URL}/#webpage`,
          url: SITE_URL,
          name: `${profile.name} | Profile`,
          inLanguage: 'en-US',
          isPartOf: { '@id': `${SITE_URL}/#website` },
          mainEntity: { '@id': `${SITE_URL}/#person` },
        });
      });
    });

    describe('WebSite schema', () => {
      const website = byType('WebSite');

      it('matches the full WebSite shape exactly', () => {
        expect(website).toEqual({
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: SITE_URL,
          name: `${profile.name} Portfolio`,
          inLanguage: 'en-US',
          publisher: { '@id': `${SITE_URL}/#person` },
        });
      });
    });

    describe('BreadcrumbList schema', () => {
      const breadcrumb = byType('BreadcrumbList');

      it('matches the full BreadcrumbList shape exactly', () => {
        expect(breadcrumb).toEqual({
          '@type': 'BreadcrumbList',
          itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL }],
        });
      });
    });

    describe('WebPage schema', () => {
      const webPage = byType('WebPage');

      it('lists the three sub-pages with correct ids, urls, and names', () => {
        expect(webPage.hasPart).toEqual([
          { '@type': 'WebPage', '@id': `${SITE_URL}/capstone#webpage`, url: `${SITE_URL}/capstone`, name: 'Bridging Transitions Capstone Defense' },
          { '@type': 'WebPage', '@id': `${SITE_URL}/credentials#webpage`, url: `${SITE_URL}/credentials`, name: 'Credentials and Verification' },
          { '@type': 'WebPage', '@id': `${SITE_URL}/internet#webpage`, url: `${SITE_URL}/internet`, name: 'Cameron Aaron on the Internet' },
        ]);
      });

      it('matches @id/url/name/isPartOf/about/primaryImageOfPage/inLanguage exactly', () => {
        expect(webPage['@id']).toBe(`${SITE_URL}/#home-page`);
        expect(webPage.url).toBe(SITE_URL);
        expect(webPage.name).toBe(`${profile.name} Portfolio`);
        expect(webPage.isPartOf).toEqual({ '@id': `${SITE_URL}/#website` });
        expect(webPage.about).toEqual({ '@id': `${SITE_URL}/#person` });
        expect(webPage.primaryImageOfPage).toEqual({
          '@type': 'ImageObject',
          url: `${SITE_URL}${profile.image}`,
        });
        expect(webPage.inLanguage).toBe('en-US');
      });

      it('respects a custom baseUrl for every sub-page id/url', () => {
        const custom = buildStructuredDataGraph('https://example.com');
        const customNodes = custom['@graph'] as SchemaNode[];
        const customWebPage = customNodes.find((n) => n['@type'] === 'WebPage')!;
        expect(customWebPage.hasPart).toEqual([
          { '@type': 'WebPage', '@id': 'https://example.com/capstone#webpage', url: 'https://example.com/capstone', name: 'Bridging Transitions Capstone Defense' },
          { '@type': 'WebPage', '@id': 'https://example.com/credentials#webpage', url: 'https://example.com/credentials', name: 'Credentials and Verification' },
          { '@type': 'WebPage', '@id': 'https://example.com/internet#webpage', url: 'https://example.com/internet', name: 'Cameron Aaron on the Internet' },
        ]);
      });
    });

    describe('Research/Publications ItemList', () => {
      const research = nodes.filter((n) => n['@type'] === 'ItemList').find((n) => n.name === 'Research and Publications')!;
      const items = research.itemListElement as Array<SchemaNode & { position: number; item: SchemaNode }>;

      it('sets the top-level ItemList @type and every nested ListItem @type exactly', () => {
        expect(research['@type']).toBe('ItemList');
        for (const entry of items) {
          expect(entry['@type']).toBe('ListItem');
        }
      });

      it('sorts by project period, descending — not source (declaration) order', () => {
        const expectedOrder = sortByDateDesc(projects, (p) => p.period).map((p) => p.title);
        expect(items.map((entry) => entry.item.name)).toEqual(expectedOrder);
      });

      it('assigns 1-based positions in list order', () => {
        expect(items.map((entry) => entry.position)).toEqual(items.map((_, i) => i + 1));
      });

      it('marks only the capstone-linked project as ScholarlyArticle with extra fields', () => {
        for (const entry of items) {
          const isCapstone = entry.item.name === projects.find((p) => p.link.includes('/capstone'))?.title;
          if (isCapstone) {
            expect(entry.item['@type']).toBe('ScholarlyArticle');
            expect(entry.item.isAccessibleForFree).toBe(true);
            expect(entry.item.educationalUse).toBe('Professional development and institutional training');
            expect(entry.item.author).toEqual({ '@id': `${SITE_URL}/#person` });
          } else {
            expect(entry.item['@type']).toBe('CreativeWork');
            expect(entry.item.isAccessibleForFree).toBeUndefined();
            expect(entry.item.author).toBeUndefined();
          }
        }
      });

      it('only includes datePublished when the project period actually parses to a date', () => {
        for (const entry of items) {
          const source = projects.find((p) => p.title === entry.item.name)!;
          const expectedDate = toIsoDate(source.period);
          if (expectedDate) {
            expect(entry.item.datePublished).toBe(expectedDate);
          } else {
            expect('datePublished' in entry.item).toBe(false);
          }
        }
      });

      it('joins tags into a comma-space-separated keywords string', () => {
        for (const entry of items) {
          const source = projects.find((p) => p.title === entry.item.name)!;
          expect(entry.item.keywords).toBe(source.tags.join(', '));
        }
      });
    });

    describe('Work Experience ItemList', () => {
      const workExperience = nodes.filter((n) => n['@type'] === 'ItemList').find((n) => n.name === 'Professional Experience')!;
      const items = workExperience.itemListElement as Array<SchemaNode & { position: number; item: SchemaNode }>;

      it('sets the top-level ItemList @type, nested ListItem @type, OrganizationRole @type, and worksFor exactly', () => {
        expect(workExperience['@type']).toBe('ItemList');
        items.forEach((entry, i) => {
          expect(entry['@type']).toBe('ListItem');
          expect(entry.item['@type']).toBe('OrganizationRole');
          expect(entry.item.worksFor).toEqual({ '@type': 'Organization', name: experiences[i].company });
        });
      });

      it('preserves experience declaration order (not date-sorted) and 1-based positions', () => {
        expect(items.map((entry) => (entry.item.worksFor as { name: string }).name)).toEqual(
          experiences.map((e) => e.company)
        );
        expect(items.map((entry) => entry.position)).toEqual(items.map((_, i) => i + 1));
      });

      it('uses the first position of each experience for roleName and period', () => {
        experiences.forEach((exp, i) => {
          const entry = items[i].item;
          expect(entry.roleName).toBe(exp.positions[0]?.title);
          const { startDate, endDate } = splitPeriod(exp.positions[0]?.period);
          if (startDate) expect(entry.startDate).toBe(startDate);
          else expect('startDate' in entry).toBe(false);
          if (endDate) expect(entry.endDate).toBe(endDate);
          else expect('endDate' in entry).toBe(false);
        });
      });
    });

    describe('Certifications ItemList', () => {
      const credentialList = nodes.filter((n) => n['@type'] === 'ItemList').find((n) => n.name === 'Certifications and Credentials')!;
      const items = credentialList.itemListElement as Array<{ position: number; item: SchemaNode }>;

      it('sorts by certification status/date, descending — not source order', () => {
        const expectedOrder = sortByDateDesc(certifications, (c) => c.status).map((c) => c.name);
        expect(items.map((entry) => entry.item.name)).toEqual(expectedOrder);
        expect(items.map((entry) => entry.position)).toEqual(items.map((_, i) => i + 1));
      });

      it('lowercases credentialCategory from cert.status', () => {
        // Match by position in the sorted list, not by name — several
        // certifications share an identical `name` (e.g. two "Emergency
        // Medical Technician (EMT)" entries with different expirations), so
        // a name-based lookup can silently grab the wrong record.
        const sortedCerts = sortByDateDesc(certifications, (c) => c.status);
        items.forEach((entry, i) => {
          expect(entry.item.credentialCategory).toBe(sortedCerts[i].status.toLowerCase());
        });
      });

      it('matches the full ItemList/ListItem/credential/Organization shape exactly', () => {
        const sortedCerts = sortByDateDesc(certifications, (c) => c.status);
        expect(credentialList['@type']).toBe('ItemList');
        expect(credentialList.name).toBe('Certifications and Credentials');
        expect(items).toEqual(
          sortedCerts.map((cert, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'EducationalOccupationalCredential',
              name: cert.name,
              credentialCategory: cert.status.toLowerCase(),
              recognizedBy: { '@type': 'Organization', name: cert.issuer },
              identifier: cert.credentialId,
            },
          }))
        );
      });
    });

    describe('Testimonials ItemList', () => {
      const testimonialList = nodes.filter((n) => n['@type'] === 'ItemList').find((n) => n.name === 'Professional Testimonials')!;
      const items = testimonialList.itemListElement as Array<{ position: number; item: SchemaNode }>;

      it('sorts by date descending and caps at 12 entries', () => {
        const expectedOrder = sortByDateDesc(testimonials, (t) => t.date)
          .slice(0, 12)
          .map((t) => t.name);
        expect(items.map((entry) => (entry.item.creator as { name: string }).name)).toEqual(expectedOrder);
        expect(items.length).toBeLessThanOrEqual(12);
      });

      it('names each entry "Testimonial from <name>" and assigns 1-based positions', () => {
        items.forEach((entry, i) => {
          expect(entry.position).toBe(i + 1);
          const creatorName = (entry.item.creator as { name: string }).name;
          expect(entry.item.name).toBe(`Testimonial from ${creatorName}`);
        });
      });

      it('matches the full ItemList/ListItem/CreativeWork/Person shape exactly', () => {
        const sorted = sortByDateDesc(testimonials, (t) => t.date).slice(0, 12);
        expect(testimonialList['@type']).toBe('ItemList');
        expect(testimonialList.name).toBe('Professional Testimonials');
        expect(items).toEqual(
          sorted.map((testimonial, i) => {
            const datePublished = toIsoDate(testimonial.date);
            return {
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'CreativeWork',
                name: `Testimonial from ${testimonial.name}`,
                text: testimonial.text,
                ...(datePublished ? { datePublished } : {}),
                creator: { '@type': 'Person', name: testimonial.name, jobTitle: testimonial.role },
              },
            };
          })
        );
      });
    });

    describe('Education ItemList', () => {
      const educationList = nodes.filter((n) => n['@type'] === 'ItemList').find((n) => n.name === 'Education')!;
      const items = educationList.itemListElement as Array<{ position: number; item: SchemaNode }>;

      it('classifies credentialCategory as certificate only when the credential text says so', () => {
        educationItems.forEach((eduItem, i) => {
          const expectedCategory = eduItem.credential.toLowerCase().includes('certificate') ? 'certificate' : 'degree';
          expect(items[i].item.credentialCategory).toBe(expectedCategory);
          expect(items[i].position).toBe(i + 1);
          expect(items[i].item.description).toBe(eduItem.details.join(' '));
        });
      });

      it('matches the full ItemList/ListItem/EducationalOccupationalCredential/CollegeOrUniversity shape exactly', () => {
        expect(educationList['@type']).toBe('ItemList');
        expect(educationList.name).toBe('Education');
        expect(items).toEqual(
          educationItems.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'EducationalOccupationalCredential',
              name: item.credential,
              credentialCategory: item.credential.toLowerCase().includes('certificate') ? 'certificate' : 'degree',
              recognizedBy: { '@type': 'CollegeOrUniversity', name: item.institution },
              description: item.details.join(' '),
            },
          }))
        );
      });
    });

    describe('FAQPage schema', () => {
      const faqPage = byType('FAQPage');

      it('sets the FAQPage @id and name exactly', () => {
        expect(faqPage['@id']).toBe(`${SITE_URL}/#faq`);
        expect(faqPage.name).toBe('Frequently Asked Questions');
      });

      it('maps every FAQ to a Question/Answer pair, in order', () => {
        expect(faqPage.mainEntity).toEqual(
          faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          }))
        );
      });
    });
  });
});
