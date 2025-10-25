# GitHub Copilot Instructions - Cameron Aaron Portfolio

## Project Overview

This is a modern, professional portfolio website built with **Next.js 15 RC** (App Router), **React 19 RC**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**. The site is a single-page application showcasing professional experience, projects, skills, and contact information with stunning visual design and SEO optimization.

## Architecture & Key Patterns

### Modular Component Architecture
- **Separated data from presentation** - All content data lives in `src/data/` directory
- **Component-based structure** - Individual components in `src/components/`
- **Clean page composition** - `src/app/page.tsx` simply composes components
- **Pattern**: Add new content to data files, create/update components for new features

### Data Layer Structure
- `src/data/profile.ts` - Personal information, stats, social links
- `src/data/experience.ts` - Work history with companies and positions
- `src/data/education.ts` - Academic credentials
- `src/data/projects.ts` - Portfolio projects with tags and links
- `src/data/skills.ts` - Technical skills, domains, certifications

### Component Structure
- `Navigation.tsx` - Sticky header with smooth scroll navigation
- `Hero.tsx` - Animated hero section with gradient background and floating elements
- `Experience.tsx` - Professional experience timeline with company logos
- `Projects.tsx` - Featured and grid project displays
- `Skills.tsx` - Technical skills with animated progress bars and domain cards
- `Contact.tsx` - Contact information and social links

### Animation Patterns with Framer Motion
- Scroll-triggered animations using `whileInView` with `viewport={{ once: true }}`
- Hover effects with `whileHover` and `whileTap`
- Staggered animations with delay multipliers: `delay: index * 0.1`
- Gradient backgrounds with animated particles
- Floating badges with continuous animation loops

### Image Handling
- All images stored in `/public/` as `.webp` format for performance
- Use Next.js `<Image>` component with explicit `width` and `height`
- Profile image uses `priority` prop and `loading="eager"` for hero section
- Company/organization logos are 40x40px consistently

### SEO & Metadata Strategy
- **App Router metadata export** in `layout.tsx` - uses Next.js 15 metadata API
- Comprehensive OpenGraph and Twitter Card meta tags
- Structured data can be added via JSON-LD script in layout
- Domain: `https://cameronaaron.com`

## Technology Stack & Constraints

### Next.js Configuration
- **App Router** (`src/app/`) with React Server Components architecture
- Using Next.js 15 RC and React 19 RC - be aware of RC-specific behaviors
- Type overrides in `package.json` for React RC types
- Path alias: `@/*` maps to `./src/*`
- No custom Next.js config - using defaults

### Styling Approach
- **Tailwind CSS** for all styling with modern gradient and glassmorphism effects
- Color palette: Purple/Pink gradients (`from-purple-600 to-pink-600`) as primary
- Responsive breakpoints: `sm:`, `md:`, `lg:` prefixes
- Common patterns:
  - Hero gradients: `bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`
  - Cards: `bg-white rounded-2xl p-8 hover:shadow-xl transition-all duration-300`
  - Glassmorphism: `bg-white/10 backdrop-blur-lg border border-white/20`
  - Section spacing: `py-20` with `container mx-auto px-6`
  - Text gradients: `bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`

### TypeScript Configuration
- Strict mode enabled
- Target: ES2017
- Module resolution: bundler
- **Important**: Component props are NOT typed in the current implementation - maintain this pattern or add explicit interfaces when refactoring

## Development Workflow

### Running the Project
```bash
npm run dev     # Start dev server at http://localhost:3000
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

### Adding New Content

#### Adding Experience/Projects/Skills
1. Update the relevant data file in `src/data/`
2. Follow the existing data structure patterns
3. Images go in `/public/` and are referenced with `/filename.webp`

#### Adding a New Section
1. Create data file if needed: `src/data/newsection.ts`
2. Create component: `src/components/NewSection.tsx`
3. Follow the pattern from existing components:
   ```tsx
   'use client';
   import { motion } from 'framer-motion';
   import { data } from '@/data/newsection';

   export default function NewSection() {
     return (
       <section id="newsection" className="py-20 bg-white">
         <div className="container mx-auto px-6">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-center mb-16"
           >
             <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
               Section Title
             </h2>
           </motion.div>
           {/* Content here */}
         </div>
       </section>
     );
   }
   ```
4. Import and add to `src/app/page.tsx`
5. Update `Navigation.tsx` navItems array if needed

#### Adding Images
1. Place `.webp` images in `/public/` directory
2. Reference with `/imagename.webp` path
3. Use Next.js `<Image>` component with explicit dimensions

## SEO & Performance Requirements

### Schema.org Structured Data
- **Critical**: Maintain the comprehensive `Person` schema in the `<Head>` section
- Include all properties: `sameAs`, `alumniOf`, `hasCredential`, `knowsLanguage`, `contactPoint`, `affiliation`, `worksFor`, `honor`
- When adding new credentials or affiliations, update the structured data accordingly

### Performance Optimization
- Images must be `.webp` format with explicit dimensions
- Use `loading="eager"` only for above-the-fold content (hero section)
- All other images should lazy load by default
- Sharp is included for automatic image optimization

### Sitemap & Robots
- `src/app/sitemap.ts` - Dynamic sitemap using Next.js App Router API
- `src/app/robots.ts` - Dynamic robots.txt using Next.js App Router API
- Both auto-update based on route configuration

## Common Pitfalls

1. **Client Component Requirement**: All components with Framer Motion must use `'use client'` directive
2. **Data Structure Consistency**: When adding data, match existing patterns exactly (arrays, objects, required fields)
3. **Image Paths**: All images in `/public/` are referenced with leading slash: `/image.webp`
4. **Animation Performance**: Always use `viewport={{ once: true }}` to prevent re-animations
5. **Gradient Text**: Use `bg-clip-text text-transparent` with gradient backgrounds
6. **Responsive Design**: Test all breakpoints - use `md:` and `lg:` for larger screens

## External Integrations

- **None currently** - all content is static and self-contained
- Contact information is hardcoded in the Contact section
- Social media links are badge images from shields.io

## Design System

### Color Palette
- Primary: Purple (`purple-600`) to Pink (`pink-600`) gradients
- Dark backgrounds: `slate-900`, `purple-900`
- Light backgrounds: `white`, `slate-50`, `purple-50`
- Text: `gray-900` (dark), `gray-600` (medium), `gray-400` (light), `white` (on dark)

### Typography
- Headings: `text-4xl md:text-5xl font-bold` with gradient text
- Subheadings: `text-2xl md:text-3xl font-bold`
- Body: `text-lg text-gray-600` or `text-gray-300` on dark
- Small text: `text-sm` or `text-xs`

### Spacing
- Section padding: `py-20`
- Container: `container mx-auto px-6`
- Card padding: `p-6` or `p-8`
- Gaps: `gap-4`, `gap-6`, `gap-8`, `gap-12`

### Effects
- Shadows: `shadow-xl`, `shadow-2xl`, `hover:shadow-lg`
- Transitions: `transition-all duration-300`
- Hover scale: `hover:scale-105` or `hover:scale-[1.02]`
- Rounded corners: `rounded-xl`, `rounded-2xl`, `rounded-full`

## Performance Tips

- Images are `.webp` format for optimal compression
- Animations use `whileInView` to animate only when visible
- Components are lazy-loaded where appropriate
- All animations have `viewport={{ once: true }}` to prevent re-triggering

## Deployment (Cloudflare Workers)

### Configuration
- **Static Export**: `output: 'export'` in `next.config.mjs`
- **Build Output**: `out/` directory (59 static files)
- **Auto Deploy**: GitHub Actions on push to `master` branch
- **Platform**: Cloudflare Pages (Workers-based)
- **Performance**: 330+ edge locations, zero cold starts, <50ms response time

### Deployment Files
- `wrangler.toml` - Cloudflare Workers config (project: cameronaaron-com)
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `public/_headers` - Caching & security headers (1-year cache for static assets)
- `public/_redirects` - HTTPS enforcement, www redirects
- `verify-deployment.sh` - Pre-flight checks script

### Build Commands
```bash
npm run build        # Production build (static export)
npm run preview      # Test with Cloudflare Workers locally
npm run deploy:prod  # Manual production deploy
./verify-deployment.sh  # Verify deployment readiness
```

### GitHub Secrets Required
- `CLOUDFLARE_API_TOKEN` - API token from Cloudflare dashboard
- `CLOUDFLARE_ACCOUNT_ID` - Account ID from Cloudflare dashboard

### Deployment Process
1. Push to `master` branch → GitHub Actions triggers
2. Build static export → Deploy to Cloudflare Pages
3. Live globally in ~2 minutes across 330+ locations

### Important Notes
- Dynamic routes (sitemap, robots) must have `export const dynamic = 'force-static'`
- Custom headers configured via `public/_headers` (not next.config)
- Free tier: 100k requests/day (sufficient for portfolio)

## Structured Data & SEO

### Comprehensive Schema.org Implementation
The site includes 46+ structured data entities across 14 schema types for maximum Google rich result eligibility.

#### Key Schemas Implemented (in `src/components/StructuredData.tsx`):
1. **Person** - Full professional profile with credentials, awards, work history
2. **ProfilePage** - Portfolio page metadata for Perspectives filter
3. **Organization** - Personal brand entity with logo
4. **FAQPage** - 8 Q&A pairs (in `src/data/faqs.ts` + `src/components/FAQ.tsx`)
5. **Review** - 4 featured testimonials with 5-star ratings
6. **BreadcrumbList** - Site navigation structure
7. **ItemList (Projects)** - All projects as SoftwareApplication entities
8. **ItemList (WorkExperience)** - All positions with OrganizationRole
9. **EducationalOccupationalCredential** - 5 certifications
10. **HowTo** - Contact instructions
11. **WebSite** - Site-level info with SearchAction
12. **ImageObject** - Image metadata with copyright (in `src/utils/imageMetadata.ts`)
13. **DefinedTermSet** - Technical skills taxonomy
14. **SoftwareApplication** - Individual project schemas

#### Rich Results Enabled:
- Knowledge Panel (Person schema)
- FAQ rich snippets (expandable in search)
- Review stars (5-star ratings)
- Breadcrumbs (site navigation in results)
- Software app cards (project carousel)
- Credential badges
- How-to step cards

#### Metadata Configuration:
- **Keywords**: 30+ targeted keywords in layout metadata
- **OpenGraph**: Enhanced with type: profile, firstName, lastName, username, gender
- **Twitter Cards**: summary_large_image with creator attribution
- **Robots**: Google Bot specific directives (max-video-preview, max-image-preview, max-snippet)
- **Apple Web App**: Configured for iOS home screen

#### Maintaining Structured Data:
- Update FAQ data in `src/data/faqs.ts` - auto-updates FAQPage schema
- Add projects to `src/data/projects.ts` - auto-included in ItemList
- Update testimonials in `src/data/testimonials.ts` - auto-updates Review schema
- Add certifications to `src/data/skills.ts` - update EducationalOccupationalCredential in StructuredData
- All schemas in `src/components/StructuredData.tsx` - imported in layout.tsx

#### Testing & Validation:
- Test with Google Rich Results Test: https://search.google.com/test/rich-results
- Validate schemas: https://validator.schema.org/
- Monitor in Google Search Console → Enhancements section
