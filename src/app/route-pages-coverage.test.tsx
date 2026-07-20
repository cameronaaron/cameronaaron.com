import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CapstonePage, { dynamic as capstoneDynamic, metadata as capstoneMetadata } from './capstone/page';
import { toYouTubeEmbedUrl } from './capstone/capstone-logic';
import CredentialsPage, { dynamic as credentialsDynamic, metadata as credentialsMetadata } from './credentials/page';
import InternetPage, { dynamic as internetDynamic, metadata as internetMetadata } from './internet/page';

import { capstone } from '@/data/capstone';

describe('route pages coverage hardening', () => {
  it('covers capstone page exports, rendering, and schema output', () => {
    expect(capstoneDynamic).toBe('force-static');
    expect(capstoneMetadata.alternates?.canonical).toBe('/capstone');

    const { container } = render(<CapstonePage />);

    expect(screen.getByRole('heading', { name: capstone.title })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Watch Full YouTube Playlist' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Watch on YouTube' }).length).toBe(capstone.videos.length);

    const schema = container.querySelector('script[type="application/ld+json"]');
    expect(schema?.textContent).toContain('"ScholarlyArticle"');
    expect(schema?.textContent).toContain('"CreativeWorkSeries"');
  });

  it('covers capstone embed-url helper branches', () => {
    expect(toYouTubeEmbedUrl('https://youtu.be/abc123xyz')).toBe('https://www.youtube.com/embed/abc123xyz');
    expect(toYouTubeEmbedUrl('https://www.youtube.com/watch?v=abc123xyz&feature=share')).toBe('https://www.youtube.com/embed/abc123xyz');
    expect(toYouTubeEmbedUrl('https://example.com/not-youtube')).toBeUndefined();
  });

  it('covers credentials page rendering and metadata', () => {
    expect(credentialsDynamic).toBe('force-static');
    expect(credentialsMetadata.alternates?.canonical).toBe('/credentials');

    const { container } = render(<CredentialsPage />);

    expect(screen.getByRole('heading', { name: 'Credentials and Verification Links' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to main portfolio' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View online features' })).toBeTruthy();
    expect(screen.getAllByText(/Credential ID:/).length).toBeGreaterThan(1);
    expect(screen.getAllByRole('link', { name: 'Verify credential' }).length).toBeGreaterThan(1);

    const schema = container.querySelector('script[type="application/ld+json"]');
    expect(schema?.textContent).toContain('"EducationalOccupationalCredential"');
  });

  it('covers internet page rendering and metadata', () => {
    expect(internetDynamic).toBe('force-static');
    expect(internetMetadata.alternates?.canonical).toBe('/internet');

    const { container } = render(<InternetPage />);

    expect(screen.getByRole('heading', { name: 'Cameron Aaron on the Internet' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to main portfolio' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View credential archive' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Speaking' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Profiles' })).toBeTruthy();
    expect(screen.getAllByText('Public recording link not provided in source notes.').length).toBeGreaterThan(0);

    const schema = container.querySelector('script[type="application/ld+json"]');
    expect(schema?.textContent).toContain('"Internet Features and Mentions"');
  });

  it('covers credentials page null credentialId branch (line 106)', async () => {
    // Mock academicVerificationResources to include a resource WITHOUT credentialId
    vi.doMock('@/data/additionalCredentials', () => ({
      academicVerificationResources: [
        {
          institution: 'Test School',
          name: 'Test Cert',
          description: 'A test',
          url: 'https://test.edu',
          // No credentialId — covers the : null branch
        },
      ],
      additionalCredentials: [],
    }));
    const { default: CredentialsPageDynamic } = await import('./credentials/page');
    render(<CredentialsPageDynamic />);
    expect(screen.getByText('Test Cert')).toBeTruthy();
  });
});

afterEach(() => {
  vi.resetModules();
});
