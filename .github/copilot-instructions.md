# GitHub Copilot Instructions - Cameron Aaron Portfolio

## Quick Start

**Tech Stack:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS + Framer Motion  
**Deployment:** Cloudflare Workers (static export)  
**Domain:** https://cameronaaron.com

```bash
npm run dev     # Development server (localhost:3000)
npm run build   # Production build → out/ directory
npm run preview # Test with Cloudflare Workers locally
```

## Architecture: Data-Driven Components

**Core Pattern:** Complete separation of content (data) and presentation (components)

```
src/data/         ← Edit content here (TypeScript objects)
  ├── profile.ts      Personal info, stats, social links
  ├── experience.ts   Work history with positions[]
  ├── projects.ts     Portfolio items with featured flag
  ├── skills.ts       Technical skills, domains, certifications
  ├── testimonials.ts Customer reviews (used in structured data)
  └── faqs.ts        FAQ content (generates Schema.org FAQPage)

src/components/   ← UI components consume data
  ├── Hero.tsx        Main landing section
  ├── Experience.tsx  Timeline with company logos
  ├── Projects.tsx    Featured + grid layouts
  └── StructuredData.tsx  SEO schemas (auto-syncs with data/)

src/app/page.tsx  ← Just composes components in order
```

**To add content:** Edit data files only. Components auto-update.  
**To add sections:** Create data file → create component → import in `page.tsx`

## Critical Patterns

### 1. Client Components with Framer Motion
**All animated components MUST have `'use client'` directive**

```tsx
'use client';
import { motion } from 'framer-motion';

export default function Section() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}  // ← REQUIRED: prevents re-animation on scroll
    >
```

### 2. Staggered Animations
Use index-based delays for list items:

```tsx
{items.map((item, i) => (
  <motion.div
    key={i}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.1 }}  // ← Stagger by 100ms
    viewport={{ once: true }}
  >
))}
```

### 3. Design System (Tailwind)
**Brand colors:** Purple/Pink gradients  
**Consistent patterns:**
- Section wrapper: `<section className="py-20 bg-background">`
- Container: `<div className="container mx-auto px-6">`
- Gradient text: `bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`
- Cards: `rounded-2xl p-8 hover:shadow-xl transition-all duration-300`
- Glassmorphism: `bg-white/10 backdrop-blur-lg border border-white/20`

### 4. Image Handling
**Strict requirements:**
- Format: `.webp` only (stored in `/public/`)
- Reference: `/image.webp` (leading slash)
- Component: Next.js `<Image>` with explicit `width` and `height`
- Hero image: `priority` prop + `loading="eager"`
- All others: lazy load (default)

Example:
```tsx
<Image src="/profile.webp" alt="Name" width={400} height={400} priority />
```

## SEO Architecture (Critical)

**Structured data in `src/components/StructuredData.tsx` auto-generates from data files:**

| Schema Type | Data Source | Impact |
|-------------|-------------|--------|
| Person, ProfilePage | `profile.ts` | Google Knowledge Panel |
| FAQPage | `faqs.ts` | Expandable FAQ snippets in search |
| Review (×4) | `testimonials.ts` | 5-star rating display |
| ItemList (Projects) | `projects.ts` | Software app carousel |
| ItemList (WorkExperience) | `experience.ts` | Job history cards |

**When editing data files, structured data updates automatically.** No manual schema editing needed.

**Metadata in `src/app/layout.tsx`:**
- OpenGraph includes `type: "profile"`, `firstName`, `lastName`, `username` for proper social cards
- 30+ SEO keywords target: "Software Engineer", "Neuroscientist", "Product Manager"
- Twitter cards use `summary_large_image` format

**Dynamic routes require `export const dynamic = 'force-static'`:**
- `src/app/sitemap.ts` - Includes section anchors (#experience, #projects, etc.)
- `src/app/robots.ts` - Standard rules + sitemap reference

**Test schemas:** https://validator.schema.org/ or Google Rich Results Test

## Cloudflare Workers Deployment

**Build configuration (`next.config.mjs`):**
```javascript
output: 'export',           // Static site generation
images: { unoptimized: true }  // Required for static export
```

**Platform-specific files:**
- `wrangler.toml` - Workers config, points to `out/` directory
- `public/_headers` - Cache control (1 year for static assets, must-revalidate for HTML)
- `public/_redirects` - HTTPS enforcement, www redirects
- `src/middleware.ts` - Security headers (HSTS, CSP, X-Frame-Options, etc.)

**Deployment workflow:**
1. `npm run build` → generates `out/` directory with 59 static files
2. Push to `master` → GitHub Actions auto-deploys to Cloudflare Pages
3. Live globally in ~2 min across 330+ edge locations

**Manual deployment:** `npm run deploy:prod` (requires Wrangler auth)  
**Pre-flight check:** `./verify-deployment.sh` (validates build, config files, Node version)

**Note:** GitHub Actions workflow file doesn't exist yet - deployment currently manual

## Adding New Content (Step-by-Step)

### Adding a Project/Experience/Skill
1. Edit relevant file in `src/data/` (no component changes needed)
2. Follow exact structure of existing entries - TypeScript interfaces enforce shape
3. Add images to `/public/` as `.webp` with descriptive names
4. Component auto-renders new data on next render

### Adding a New Section
```bash
# 1. Create data file
src/data/newsection.ts

# 2. Create component (use this template)
'use client';
import { motion } from 'framer-motion';
import { data } from '@/data/newsection';

export default function NewSection() {
  return (
    <section id="newsection" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Section Title
          </h2>
        </motion.div>
        {/* Content implementation */}
      </div>
    </section>
  );
}

# 3. Import in src/app/page.tsx
import NewSection from '@/components/NewSection';

# 4. Update Navigation.tsx navItems array if section needs nav link
```

## TypeScript Quirks

**No prop types on components** - Current pattern omits interface definitions for component props. When refactoring, add interfaces like:
```tsx
interface HeroProps {
  variant?: 'primary' | 'secondary';
}

export default function Hero({ variant = 'primary' }: HeroProps) {
```

**Path alias:** `@/*` maps to `src/*` - use for all internal imports

## Common Pitfalls

1. **Missing `'use client'`** - Framer Motion components crash without it
2. **Forgot `viewport={{ once: true }}`** - Animations retrigger on every scroll
3. **Wrong image path** - Must start with `/` (e.g., `/profile.webp`, not `profile.webp`)
4. **Breaking data structure** - Match existing object shapes exactly (check interfaces)
5. **Gradient text missing `text-transparent`** - Won't show gradient without it
6. **Cloudflare static export** - Can't use Next.js features requiring Node.js runtime (API routes, ISR, etc.)
7. **Missing ARIA labels** - All sections need `aria-label` or `aria-labelledby` for accessibility
8. **Focus management** - Interactive elements must have visible focus states

## Performance & Accessibility Standards

**Performance Budgets:**
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Total Blocking Time: < 300ms
- Lighthouse Score: > 95 (all categories)

**Accessibility Requirements:**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Skip to main content link
- Proper heading hierarchy
- Focus visible states
- Reduced motion support (`prefers-reduced-motion`)

**Security Headers (via `_headers` and `middleware.ts`):**
- HSTS with preload
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- CSP policy enforced
- Permissions-Policy restricts camera, mic, geolocation

**Image Optimization:**
- WebP format only
- 1-year cache with immutable flag
- Explicit width/height to prevent CLS
- Priority loading for hero image only
