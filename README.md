# BookedLoop — Agency Website

Premium, conversion-focused agency website for **BookedLoop**, built with Next.js App Router + TypeScript + Tailwind CSS + Framer Motion. Designed for US small business owners (salons, clinics, barbers, home services, repair, fitness studios, tutors, etc.).

## What’s Included

- Pages: Home, Services, Pricing, Sample Work, About, Contact
- Centralized content/config files (easy to edit later)
- No fake testimonials (sample work is clearly labeled as demo/sample/example)
- Working contact form architecture with validation + success/error states
- Google “Book a Free Audit” CTA wired to your scheduling link
- Light/Dark theme toggle

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS (v4)
- Framer Motion (subtle scroll/fade/stagger animation)

## Quick Start

### Requirements

- Node.js 20+ recommended
- npm (project includes a `package-lock.json`)

### Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Production build

```bash
npm run lint
npm run build
npm run start
```

## Project Structure

- App routes (pages): [app/](./app)
  - Home: `app/page.tsx`
  - Services: `app/services/page.tsx`
  - Pricing: `app/pricing/page.tsx`
  - Sample Work: `app/sample-work/page.tsx`
  - About: `app/about/page.tsx`
  - Contact: `app/contact/page.tsx`
  - Contact API: `app/api/contact/route.ts`
- Reusable UI + layout: [components/](./components)
  - Navigation/footer: `components/SiteHeader.tsx`, `components/SiteFooter.tsx`
  - Theme toggle: `components/ThemeToggle.tsx`
  - Contact form: `components/ContactForm.tsx`
  - Motion helpers: `components/motion.tsx`, `components/AnimateIn.tsx`
  - UI primitives: `components/ui/*`
- Content & configuration: [lib/](./lib)
  - Site-wide config (name, CTAs, booking link, contact): `lib/site.ts`
  - Services: `lib/content/services.ts`
  - Pricing & featured bundle: `lib/content/pricing.ts`
  - Sample work (explicitly labeled demo/sample/example): `lib/content/sampleWork.ts`
  - FAQs + industries list: `lib/content/faqs.ts`
- Global styles (theme tokens): `app/globals.css`
- Static assets: [public/](./public)
  - Logo: `public/bookedloop.png`

## Editing Content (Most Common Changes)

### Update company details / CTA / booking link

Edit [site.ts](file:///c:/Users/Mohid/Desktop/Project/bookedloop/lib/site.ts):

- `site.name`, `site.tagline`, `site.description`
- `site.contact.email`, `site.contact.phone`
- `site.booking.freeAuditUrl`
- `site.ctas.primary.href` (primary CTA used throughout the site)

### Update services

Edit [services.ts](file:///c:/Users/Mohid/Desktop/Project/bookedloop/lib/content/services.ts).

Each service is a single, clean offer and includes:
- `pricingLines` (e.g., one-time + add-on + optional support)
- `pricingNote` (optional)
- `included` list (bullets)

### Update pricing/packages

Edit [pricing.ts](file:///c:/Users/Mohid/Desktop/Project/bookedloop/lib/content/pricing.ts).

- `priceLines` supports multiple lines (ex: base price + add-ons + optional support)
- `recommended: true` highlights the featured bundle
- `pricing.note` controls the global note about custom bundles and final pricing variability

### Update sample work (honest demo only)

Edit [sampleWork.ts](file:///c:/Users/Mohid/Desktop/Project/bookedloop/lib/content/sampleWork.ts).

Everything here is intentionally labeled as:
- “Sample Project”
- “Demo Case Study”
- “Example Workflow”

Replace with real client work when you have permission and real results.

## Contact Form & Lead Delivery

### Frontend form

The Contact page includes a validated form with success/error states:
- [ContactForm.tsx](file:///c:/Users/Mohid/Desktop/Project/bookedloop/components/ContactForm.tsx)

### Backend route

Form submissions are handled by:
- [route.ts](file:///c:/Users/Mohid/Desktop/Project/bookedloop/app/api/contact/route.ts)

By default, it validates the payload and returns `{ ok: true }`. To forward leads to a CRM / automation tool, set:

```bash
BOOKEDLOOP_CONTACT_WEBHOOK_URL=https://your-webhook-url
```

This webhook will receive JSON fields like name, business name, email, phone, website, service interest, etc.

## Scheduling (Free Audit)

The primary CTA “Book a Free Audit” is wired to:

- https://calendar.app.google/4EBvCxGmZKituHH17

To change it later, update `site.booking.freeAuditUrl` and/or `site.ctas.primary.href` in [site.ts](file:///c:/Users/Mohid/Desktop/Project/bookedloop/lib/site.ts).

## Theme Toggle (Light/Dark)

- Theme tokens live in `app/globals.css`
- The toggle sets `data-theme="light|dark"` on the `<html>` element and persists in `localStorage`
- The toggle component is: [ThemeToggle.tsx](file:///c:/Users/Mohid/Desktop/Project/bookedloop/components/ThemeToggle.tsx)

## Scripts

From [package.json](file:///c:/Users/Mohid/Desktop/Project/bookedloop/package.json):

- `npm run dev` — local development
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint

## Deployment

This is a standard Next.js App Router project and can be deployed to Vercel or any Node-compatible hosting:

1. Set environment variables (optional, only needed for lead forwarding)
2. Build: `npm run build`
3. Start: `npm run start`

## Troubleshooting

### Hydration warnings

Hydration warnings happen when the server-rendered HTML differs from the first client render. Common causes include using `window`/`localStorage` in render logic, time-based values (`Date.now()`), or browser extensions modifying HTML.

If you see a hydration message, confirm client-only logic runs inside `useEffect` and that SSR output is stable.

### “Book a Free Audit” opens in same tab

Buttons detect external URLs and render a safe `<a>` tag that opens in a new tab. The behavior is implemented in:
- [Button.tsx](file:///c:/Users/Mohid/Desktop/Project/bookedloop/components/ui/Button.tsx)

## Notes

- This repo intentionally avoids fake testimonials and fake results.
- “Sample Work” is explicitly labeled as demo/sample/example until you replace it with real client projects.
