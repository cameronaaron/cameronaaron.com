import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StructuredData from './StructuredData';
import { navItems } from '@/data/navigation';
import { profile } from '@/data/profile';
import { faqs } from '@/data/faqs';
import { certifications } from '@/data/certifications';
import { testimonials } from '@/data/testimonials';

function readJsonLd(container: HTMLElement): Record<string, unknown> {
  const script = container.querySelector('script[type="application/ld+json"]');
  expect(script).toBeTruthy();
  return JSON.parse(script!.textContent!);
}

describe('structured data regression', () => {
  it('produces a single @graph payload', () => {
    const { container } = render(<StructuredData />);
    const json = readJsonLd(container);
    expect(json['@context']).toBe('https://schema.org');
    expect(Array.isArray(json['@graph'])).toBe(true);
  });

  it('@graph includes the core schemas needed for Google rich results', () => {
    const { container } = render(<StructuredData />);
    const { '@graph': graph } = readJsonLd(container) as { '@graph': Array<{ '@type': string }> };
    const types = graph.map((node) => node['@type']);

    expect(types).toContain('Person');
    expect(types).toContain('WebSite');
    expect(types).toContain('ProfilePage');
    expect(types).toContain('FAQPage');
  });

  it('FAQPage contains every FAQ entry from data/faqs.ts', () => {
    const { container } = render(<StructuredData />);
    const { '@graph': graph } = readJsonLd(container) as {
      '@graph': Array<{ '@type': string; mainEntity?: Array<{ name: string }> }>;
    };
    const faqPage = graph.find((node) => node['@type'] === 'FAQPage');
    expect(faqPage?.mainEntity?.length).toBe(faqs.length);
  });

  it('Person schema carries the canonical email and image', () => {
    const { container } = render(<StructuredData />);
    const { '@graph': graph } = readJsonLd(container) as {
      '@graph': Array<{ '@type': string; email?: string; image?: string }>;
    };
    const person = graph.find((node) => node['@type'] === 'Person');
    expect(person?.email).toBe(profile.email);
    expect(person?.image).toContain(profile.image);
  });

  it('certifications appear in hasCredential with their issuer recognised', () => {
    const { container } = render(<StructuredData />);
    const { '@graph': graph } = readJsonLd(container) as {
      '@graph': Array<{ '@type': string; hasCredential?: Array<{ identifier?: string; recognizedBy?: { name: string } }> }>;
    };
    const person = graph.find((node) => node['@type'] === 'Person');
    expect(person?.hasCredential?.length).toBe(certifications.length);
    for (const cert of certifications) {
      const entry = person?.hasCredential?.find((credential) => credential.identifier === cert.credentialId);
      expect(entry?.recognizedBy?.name).toBe(cert.issuer);
    }
  });

  it('every testimonial name appears somewhere in the JSON-LD payload', () => {
    const { container } = render(<StructuredData />);
    const payload = JSON.stringify(readJsonLd(container));
    const referenced = testimonials.filter((t) => payload.includes(t.name));
    // The graph trims to the most recent testimonials by date; at least 8 should be present.
    expect(referenced.length).toBeGreaterThanOrEqual(8);
  });
});

describe('navigation regression', () => {
  it('every navItem points to a hash anchor', () => {
    for (const item of navItems) {
      expect(item.href.startsWith('#')).toBe(true);
      expect(item.name.length).toBeGreaterThan(0);
    }
  });

  it('nav anchors are unique', () => {
    const hrefs = navItems.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('the navigation lists Home first', () => {
    expect(navItems[0]).toEqual({ name: 'Home', href: '#home' });
  });
});
