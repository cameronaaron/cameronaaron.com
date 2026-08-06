# Cameron Aaron - Portfolio

Modern portfolio website built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4. Deployed globally on Cloudflare Pages.

## 🚀 Quick Start

```bash
npm install
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint checks
npm run preview      # Local preview with Wrangler
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
- security/cache/404 headers in `public/_headers`
- Pages-first deploy script wiring in `package.json`
- no production worker deploy surface in `wrangler.toml`

CI now runs this automatically before lint/typecheck/build.

## ✅ Performance Testing

```bash
npm run test:performance:contracts   # Static output budget checks (HTML/JS/CSS/images)
npm run test:performance             # Build + budget checks + Lighthouse CI assertions
```

`test:performance:contracts` validates deterministic build-time budgets from `out/`.
Lighthouse assertions remain active in CI for runtime UX metrics (FCP, LCP, CLS, TBT, Speed Index, and Interactivity).

## 📁 Project Structure

```text
src/
├── app/              # Next.js App Router
├── components/       # UI components
├── data/            # Content (edit here!)
└── utils/           # Helper functions

public/              # Static assets (.avif images)
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

Images go in `public/` as `.avif` files (AVIF is the required render-path format; see the asset-weight contract).

## 🚀 Deployment

**Automatic:** Push to `master` → Live via Cloudflare Pages Git integration

**Manual (recommended):**

```bash
./scripts/verify/verify-deployment.sh    # Pre-flight checks
npm run deploy:prod       # Deploy to production
```

Deployment is now blocked unless strict Lighthouse/performance checks pass (100 category scores + metric assertions via `test:performance`).

**Requirements:**

- Cloudflare Pages project: `cameronaaronsite`

### Pages Redirect Notes

The production redirect behavior is enforced by `public/_redirects` and `public/_headers`:

- `https://www.cameronaaron.com/* -> https://cameronaaron.com/:splat`
- `https://workshop.cameronaaron.com/* -> https://cameronaaron.com/`
- `https://2eschool.org/* -> https://cameronaaron.com/`
- `https://www.2eschool.org/* -> https://cameronaaron.com/`
- `/index.html -> /`
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
6. Only after all probes pass, confirm there are no legacy Worker custom-domain or Worker route bindings left.

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

Copyright © 2026 Cameron Aaron. All rights reserved. See [LICENSE](./LICENSE)
for terms.

---

**Status:** ✅ Production Ready | **Last Updated:** August 2026
