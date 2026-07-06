#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = join(process.cwd(), 'out');
const failures = [];

function check(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function getMetaContent(html, matcher) {
  const re = new RegExp(`<meta[^>]+${matcher}[^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  const match = html.match(re);
  return match?.[1];
}

function run() {
  const indexPath = join(OUT_DIR, 'index.html');
  const robotsPath = join(OUT_DIR, 'robots.txt');
  const sitemapPath = join(OUT_DIR, 'sitemap.xml');
  const imageSitemapPath = join(OUT_DIR, 'sitemap-images.xml');
  const ogImagePath = join(OUT_DIR, 'social', 'opengraph-image.png');
  const twitterImagePath = join(OUT_DIR, 'social', 'twitter-image.png');

  check(existsSync(indexPath), 'Missing out/index.html. Run npm run build first.');
  check(existsSync(robotsPath), 'Missing out/robots.txt.');
  check(existsSync(sitemapPath), 'Missing out/sitemap.xml.');
  check(existsSync(imageSitemapPath), 'Missing out/sitemap-images.xml.');
  check(existsSync(ogImagePath), 'Missing out/social/opengraph-image.png.');
  check(existsSync(twitterImagePath), 'Missing out/social/twitter-image.png.');

  if (!failures.length) {
    const html = read(indexPath);
    const robots = read(robotsPath);
    const sitemap = read(sitemapPath);

    check(/<title>[^<]{25,}<\/title>/i.test(html), 'Missing or too-short <title>.');
    check(/<meta[^>]+name=["']description["'][^>]+content=["'][^"']{70,}["'][^>]*>/i.test(html), 'Missing or too-short meta description.');
    check(/<link[^>]+rel=["']canonical["'][^>]+href=["']https:\/\/cameronaaron\.com\/?["'][^>]*>/i.test(html), 'Canonical tag missing or invalid.');

    check(Boolean(getMetaContent(html, "property=[\"']og:title[\"']")), 'Missing og:title.');
    check(Boolean(getMetaContent(html, "property=[\"']og:description[\"']")), 'Missing og:description.');
    check(Boolean(getMetaContent(html, "property=[\"']og:image[\"']")), 'Missing og:image.');
    check(Boolean(getMetaContent(html, "name=[\"']twitter:card[\"']")), 'Missing twitter:card.');
    check(Boolean(getMetaContent(html, "name=[\"']twitter:title[\"']")), 'Missing twitter:title.');
    check(Boolean(getMetaContent(html, "name=[\"']twitter:description[\"']")), 'Missing twitter:description.');
    check(Boolean(getMetaContent(html, "name=[\"']twitter:image[\"']")), 'Missing twitter:image.');

    const ldJsonScripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    check(ldJsonScripts.length > 0, 'No JSON-LD scripts found.');

    if (ldJsonScripts.length > 0) {
      try {
        const parsed = JSON.parse(ldJsonScripts[0][1]);
        const graph = parsed?.['@graph'];
        check(Array.isArray(graph), 'JSON-LD graph is missing.');

        if (Array.isArray(graph)) {
          const types = new Set(graph.map((node) => node?.['@type']));
          check(types.has('Person'), 'JSON-LD missing Person type.');
          check(types.has('WebSite'), 'JSON-LD missing WebSite type.');
          check(types.has('WebPage'), 'JSON-LD missing WebPage type.');
          check(types.has('ProfilePage'), 'JSON-LD missing ProfilePage type.');
          check(types.has('BreadcrumbList'), 'JSON-LD missing BreadcrumbList type.');

          // Guard against invalid Review rich-result markup that caused Search Console errors.
          check(!types.has('Review'), 'JSON-LD must not emit Review type for testimonials.');

          const graphJson = JSON.stringify(graph);
          check(!graphJson.includes('"itemReviewed"'), 'JSON-LD must not include itemReviewed in testimonial graph.');
        }
      } catch {
        check(false, 'Failed to parse JSON-LD script.');
      }
    }

    check(/Sitemap:\s*https:\/\/cameronaaron\.com\/sitemap\.xml/i.test(robots), 'robots.txt missing primary sitemap declaration.');
    check(!/Disallow:\s*\/_next\//i.test(robots), 'robots.txt should not disallow /_next/.');

    const locMatches = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    check(locMatches.length > 0, 'sitemap.xml has no <loc> entries.');
    check(locMatches.some((loc) => loc === 'https://cameronaaron.com/'), 'sitemap.xml missing canonical home URL.');
    check(!locMatches.some((loc) => loc.includes('#')), 'sitemap.xml contains fragment URLs (#), which should not be included.');
  }

  if (failures.length > 0) {
    console.error('SEO integrity check failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('SEO integrity check passed.');
}

run();
