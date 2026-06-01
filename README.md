# Cameron Aaron - Portfolio

Modern portfolio website built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4. Deployed globally on Cloudflare Pages.

## 🚀 Quick Start

```bash
npm install
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint checks
npm run preview      # Test with Cloudflare Workers
```

## ✅ Accessibility Automation

```bash
npm run test:a11y:contracts   # WCAG-focused Vitest contracts
npm run test:a11y:scanners    # pa11y + Nu HTML validator against local site
npm run test:a11y:external    # pa11y against deployed/external URL
npm run test:a11y:automated   # Runs both in sequence
npm run test:a11y:ci          # Contracts + local scanners + external pa11y
```

Optional scanner env flags:

- `A11Y_AUTOSTART=0` do not auto-start `next dev` (expects server already running)
- `A11Y_PORT=3001` change the local port used by scanner checks
- `A11Y_URL=http://127.0.0.1:3001` override scanner target URL directly
- `A11Y_NU_STRICT=1` fail the scanner suite on Nu validator HTML errors
- `A11Y_EXTERNAL_URL=https://cameronaaron.com` target URL for `test:a11y:external`

## ✅ Pages Parity Guard

```bash
npm run test:pages:parity
```

This check fails if required migration parity contracts drift:

- host/canonical redirects in `public/_redirects`
- host redirects and canonicalization edge logic in `public/_worker.js`
- security/cache/404 headers in `public/_headers`
- Pages-first deploy script wiring in `package.json`
- Pages deploy labels in `.github/workflows/deploy-production.yml`

CI now runs this automatically before lint/typecheck/build.

## 📁 Project Structure

```text
src/
├── app/              # Next.js App Router
├── components/       # UI components
├── data/            # Content (edit here!)
└── utils/           # Helper functions

public/              # Static assets (.webp images)
```

## 🛠️ Tech Stack

- **Next.js 16.2.6** - React framework with App Router
- **React 19.2.6** - UI library
- **TypeScript 6.0.3** - Type safety
- **Tailwind CSS 4.3.0** - Styling
- **Framer Motion 12.40.0** - Animations
- **Cloudflare Pages** - Global static deployment

## ✏️ Editing Content

Update content in `src/data/` directory:

- `profile.ts` - Personal info
- `experience.ts` - Work history
- `projects.ts` - Portfolio projects
- `skills.ts` - Technical skills
- `testimonials.ts` - Recommendations
- `faqs.ts` - FAQ section

Images go in `public/` as `.webp` files.

## 🚀 Deployment

**Automatic:** Push to `master` → Live in 2 minutes via GitHub Actions

**Manual (recommended):**

```bash
./verify-deployment.sh    # Pre-flight checks
npm run deploy:prod       # Deploy to production
```

Alternative worker deploy (KV-backed, subject to write limits):

```bash
npm run deploy:worker:prod
```

**Requirements:**

- GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Cloudflare Pages project: `cameronaaronsite`

### Worker Parity Notes (Pages Migration)

The previous Worker behavior has been mapped as follows:

- `workshop.cameronaaron.com/* -> https://cameronaaron.com/` is enforced by `public/_worker.js`.
- `www -> apex` canonical redirect is enforced by `public/_worker.js`.
- `/index.html -> /` canonical redirect is enforced by `public/_worker.js` and backed by `public/_redirects`.
- Security headers are provided by `public/_headers` (including `X-Frame-Options: DENY`).

Dashboard-level items that are not code-configured in this repo:

- Add `2eschool.org` and `www.2eschool.org` as custom domains (or create zone Redirect Rules if they should canonicalize to `cameronaaron.com`).
- Ensure SSL/TLS and proxy are enabled for all mapped domains.

### Cloudflare Dashboard Checklist (Final Cutover)

1. In Cloudflare Pages, open project `cameronaaronsite` and verify latest production deployment is healthy.
2. In Pages custom domains, add/verify `cameronaaron.com`, `www.cameronaaron.com`, and `workshop.cameronaaron.com`.
3. In DNS for `cameronaaron.com`, set records exactly as requested by the Pages domain wizard and keep proxy enabled.
4. Wait until each Pages domain shows active/verified status and TLS certificate is issued.
5. Run live probes:
   - `https://cameronaaron.com` returns 200
   - `https://www.cameronaaron.com` returns 301 to apex
   - `https://workshop.cameronaaron.com` returns 301 to apex
   - missing route returns 404 with expected body
6. Only after all probes pass, remove legacy Worker custom-domain and Worker route bindings.

## 📊 Performance

- Bundle: 53.3 kB
- First Load: 155 kB
- Static files: 59
- Response time: <50ms globally
- Deployment: 330+ edge locations

## 🔍 SEO Features

- 46+ structured data entities (Schema.org)
- OpenGraph & Twitter Cards
- Dynamic sitemap & robots.txt
- Google rich results ready (FAQ, Reviews, Breadcrumbs, etc.)

## 📞 Contact

- **Email:** <cameronthescientist@pm.me>
- **GitHub:** [github.com/cameronaaron](https://github.com/cameronaaron)
- **LinkedIn:** [linkedin.com/in/cameronaaron](https://linkedin.com/in/cameronaaron)
- **Website:** [cameronaaron.com](https://cameronaaron.com)

## 📄 License

Copyright © 2025 Cameron Aaron. All rights reserved.

---

**Status:** ✅ Production Ready | **Last Updated:** October 2025
