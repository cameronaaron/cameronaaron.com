import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { additionalCredentials, academicVerificationResources } from './additionalCredentials';
import { certifications } from './certifications';
import { educationItems } from './education';
import { internetFeatures } from './internetFeatures';
import { projects } from './projects';

function normalizeUrl(value: string): string {
  return value.trim().replace(/[.,;:!?]+$/, '');
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function getHostname(value: string): string {
  return new URL(value).hostname.toLowerCase();
}

describe('meoninternet coverage integration', () => {
  it('maps fixed verification links to credential datasets', () => {
    const academicUrls = academicVerificationResources.map((item) => item.url);
    const academicIds = academicVerificationResources.map((item) => item.credentialId ?? '');
    const certificationUrls = certifications.map((item) => item.verificationUrl);

    expect(academicUrls).toContain(
      'https://www.conncoll.edu/academics/registrar/digital-diplomas/cediploma-validation/'
    );
    expect(academicUrls).toContain(
      'https://www.parchment.com/lp/award/5ed28264-10a0-4798-b16b-f94393e0b7da'
    );
    expect(academicIds).toContain('227H-DXTM-CXND');
    expect(academicIds).toContain('5ed28264-10a0-4798-b16b-f94393e0b7da');
    expect(certificationUrls).toContain(
      'https://www.parchment.com/lp/award/5ed28264-10a0-4798-b16b-f94393e0b7da'
    );
  });

  it('covers all listed Coursera and KultureCity credentials', () => {
    const names = additionalCredentials.map((item) => item.name);
    const ids = additionalCredentials.map((item) => item.credentialId);

    expect(names).toContain('Google Advanced Data Analytics Specialization');
    expect(names).toContain('Google Business Intelligence Specialization');
    expect(names).toContain('Google Project Management Specialization');
    expect(names).toContain('Google Data Analytics Specialization');
    expect(names).toContain('Google IT Automation with Python Specialization');
    expect(names).toContain('G Suite Administration Specialization');
    expect(names).toContain('Cloud Engineering with GCP Specialization');
    expect(names).toContain('Google IT Support Specialization');
    expect(names).toContain('Architecting with Google Compute Engine Specialization');

    expect(names).toContain('SENSORY INCLUSIVE Training Certificate');
    expect(names).toContain('SENSORY INCLUSIVE First Responder Training Certificate');
    expect(names).toContain('KultureCity Sensory Accessible/Inclusive Training');

    expect(ids).toContain('YL97H6X2CJB9');
    expect(ids).toContain('AN29HKSZVTSJ');
    expect(ids).toContain('35GA4PT55P58');
    expect(ids).toContain('NNB9A5JV8WSA');
  });

  it('places internet features and publications into internet and projects data', () => {
    const internetTitles = internetFeatures.map((item) => item.title);
    const internetUrls = internetFeatures.map((item) => item.url ?? '');
    const projectTitles = projects.map((item) => item.title);
    const projectLinks = projects.map((item) => item.link);

    expect(internetTitles).toContain('2e Symposium Speaker Biography');
    expect(internetTitles).toContain('Stanford Neurodiversity in Entrepreneurship Summit Speaker Listing');
    expect(internetTitles).toContain('Neurodiversity Advocacy Session with Kristin Rourke and Cameron Aaron');
    expect(internetTitles).toContain('4me Welcomes Cameron Aaron');
    expect(internetTitles).toContain('Internships: By the Dozen');
    expect(internetTitles).toContain('Top Emerging Talent Summer 2021');
    expect(internetTitles).toContain('Genetic RefleXions: A Magic Mirror That Displays Genetic Info');
    expect(internetTitles).toContain('Journal of Vision Abstract (VSS 2021)');
    expect(internetTitles).toContain('ResearchGate Profile & Publications Archive');
    expect(internetTitles).toContain('LinkedIn Activity Highlight');

    expect(internetUrls).toContain('https://www.stanfordnnea.com/2023-speakers');
    expect(internetUrls).toContain('https://doi.org/10.1167/jov.21.9.2719');
    expect(internetUrls).toContain('https://www.linkedin.com/posts/cameron-aaron-21-is-currently-working-as-share-6657585783760920576-dLcj/');

    expect(projectTitles).toContain(
      'Lapses in Sustained Attention Predicted by Changes in Visually-Guided Movements'
    );
    expect(projectTitles).toContain('Genetic RefleXions Magic Mirror');
    expect(projectTitles).toContain('Stanford Neurodiversity Summit Panel');
    expect(projectTitles).toContain('Bridges 2e Center Vision & Leadership Symposium');
    expect(projectTitles).toContain('4me Welcomes Cameron Aaron');
    expect(projectTitles).toContain('Top Emerging Talent - Pangea Summer 2021');
    expect(projectTitles).toContain('Internships: By the Dozen');
    expect(projectTitles).toContain('Toxoplasma Gondii Modifies Personality');
    expect(projectTitles).toContain('The Real Magical Girls');
    expect(projectTitles).toContain('EAS 101 Essay');

    expect(projectLinks).toContain('https://doi.org/10.1167/jov.21.9.2719');
    expect(projectLinks).toContain(
      'https://www.linkedin.com/pulse/toxoplasma-gondii-modifies-personality-cameron-aaron'
    );
    expect(projectLinks).toContain(
      'https://www.researchgate.net/publication/341276786_The_Real_Magical_Girls?_tp=eyJjb250ZXh0Ijp7ImZpcnN0UGFnZSI6InByb2ZpbGUiLCJwYWdlIjoicHJvZmlsZSJ9fQ'
    );
    expect(projectLinks).toContain('https://www.linkedin.com/pulse/eas-101-essay-cameron-aaron');
  });

  it('keeps degree data in education where it belongs', () => {
    const degreeEntry = educationItems.find((item) => item.institution === 'Connecticut College');

    expect(degreeEntry).toBeDefined();
    expect(degreeEntry?.credential).toContain('Bachelor of Arts');
    expect(degreeEntry?.credential).toContain('Psychology');
    expect(degreeEntry?.credential).toContain('Computer Science');

    const verificationUrls = degreeEntry?.verificationLinks?.map((link) => link.url) ?? [];
    expect(verificationUrls).toContain(
      'https://www.conncoll.edu/academics/registrar/digital-diplomas/cediploma-validation/'
    );
  });

  it('uses institution-specific website labels for education verification links', () => {
    const websiteLinks = educationItems.flatMap((item) =>
      (item.verificationLinks ?? []).filter((link) => link.label.toLowerCase().includes('website'))
    );

    const labels = websiteLinks.map((link) => link.label);
    expect(labels).not.toContain('School Website');

    const labelToHostnames = new Map<string, Set<string>>();
    for (const link of websiteLinks) {
      const hosts = labelToHostnames.get(link.label) ?? new Set<string>();
      hosts.add(getHostname(link.url));
      labelToHostnames.set(link.label, hosts);
    }

    for (const hosts of labelToHostnames.values()) {
      expect(hosts.size).toBe(1);
    }
  });

  it('ensures every URL listed in meoninternet.md is represented in source data', () => {
    const meOnInternetPath = path.resolve(__dirname, '..', '..', 'meoninternet.md');
    const source = fs.readFileSync(meOnInternetPath, 'utf8');
    // URLs in meoninternet.md are markdown autolinks (<https://…>), so the
    // closing angle bracket terminates a URL just like whitespace does.
    const urlMatches = source.match(/https?:\/\/[^\s)>]+/g) ?? [];
    const sourceUrls = new Set(urlMatches.map(normalizeUrl));

    const representedUrls = new Set<string>([
      ...academicVerificationResources.map((item) => item.url),
      ...additionalCredentials.map((item) => item.verificationUrl),
      ...certifications.map((item) => item.verificationUrl),
      ...internetFeatures.map((item) => item.url ?? ''),
      ...projects.map((item) => item.link),
      ...educationItems.flatMap((item) =>
        (item.verificationLinks ?? []).map((link) => link.url)
      ),
    ].map((url) => normalizeUrl(url)));

    const missing = [...sourceUrls].filter((url) => !representedUrls.has(url));

    expect(missing).toEqual([]);
  });

  it('covers key non-URL source claims from meoninternet.md in structured text fields', () => {
    const textCorpus = normalizeText(
      [
        ...academicVerificationResources.flatMap((item) => [
          item.name,
          item.institution,
          item.description,
          item.credentialId ?? '',
        ]),
        ...additionalCredentials.flatMap((item) => [
          item.name,
          item.issuer,
          item.issued,
          item.credentialId,
          item.notes ?? '',
        ]),
        ...certifications.flatMap((item) => [
          item.name,
          item.issuer,
          item.status,
          item.credentialId,
        ]),
        ...educationItems.flatMap((item) => [
          item.institution,
          item.credential,
          item.period,
          ...item.details,
          ...(item.verificationLinks ?? []).flatMap((link) => [link.label]),
        ]),
        ...internetFeatures.flatMap((item) => [
          item.title,
          item.organization,
          item.period,
          item.summary,
          item.category,
        ]),
        ...projects.flatMap((item) => [
          item.title,
          item.description,
          item.period,
          ...(item.tags ?? []),
          item.cta ?? '',
        ]),
      ].join(' ')
    );

    const requiredPhrases = [
      'suite of tools level 2',
      'bachelor of arts psychology computer science',
      'hearing from experienced advocates in neurodiversity',
      'kristin rourke and cameron aaron',
      'top emerging talent',
      'sensory inclusive',
      'researchgate profile publications archive',
      'toxoplasma gondii modifies personality',
      'the real magical girls',
      'eas 101 final paper',
    ].map((phrase) => normalizeText(phrase));

    const missingPhrases = requiredPhrases.filter((phrase) => !textCorpus.includes(phrase));

    expect(missingPhrases).toEqual([]);
  });
});
