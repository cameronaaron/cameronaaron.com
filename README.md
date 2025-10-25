# Cameron E. Aaron - Portfolio

Modern portfolio website built with Next.js 15, React 19, TypeScript, and Tailwind CSS. Deployed globally on Cloudflare Workers.

## 🚀 Quick Start

```bash
npm install
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Test with Cloudflare Workers
```

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

- **Next.js 15.5.6** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type safety
- **Tailwind CSS 3.4.18** - Styling
- **Framer Motion 11.18.2** - Animations
- **Cloudflare Workers** - Edge deployment

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

**Manual:**

```bash
./verify-deployment.sh    # Pre-flight checks
npm run deploy:prod       # Deploy to production
```

**Requirements:**

- GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Cloudflare Pages project: `cameronaaronsite`

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

Copyright © 2025 Cameron E. Aaron. All rights reserved.

---

**Status:** ✅ Production Ready | **Last Updated:** October 2025
