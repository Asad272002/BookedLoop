export type ServiceId =
  | "website-setup"
  | "review-automation"
  | "social-presence"
  | "crm-followup"
  | "gbp-optimization"
  | "local-seo"
  | "growth-campaigns";

export type Service = {
  id: ServiceId;
  name: string;
  short: string;
  description: string;
  whoFor: string;
  included: string[];
  outcome: string;
  pricingLines: string[];
  pricingNote?: string;
  ctaLabel?: string;
  href: string;
  badge?: string;
};

export const services: Service[] = [
  {
    id: "website-setup",
    name: "Website Setup",
    short: "A clean, professional website that helps customers take action.",
    description:
      "A modern, mobile-friendly website built for clarity and conversion. We keep it simple: explain what you do, build trust, and make it easy for customers to contact you or book.",
    whoFor:
      "Local service businesses that need a professional online presence that’s easy to understand on mobile.",
    included: [
      "Mobile-friendly website",
      "Homepage",
      "Services section",
      "About section",
      "Contact form",
      "WhatsApp / click-to-call button",
      "Basic SEO setup",
      "Launch support",
    ],
    outcome: "A cleaner online presence that helps more visitors contact you.",
    pricingLines: ["$500 one-time", "Booking add-on: +$200 one-time", "Optional support: $100/month"],
    pricingNote:
      "Booking add-on includes booking integration, service selection flow, appointment request or calendar booking, and confirmation flow. Optional support covers ongoing edits and checks.",
    href: "/services#website-setup",
    ctaLabel: "See Details",
    badge: "Core",
  },
  {
    id: "review-automation",
    name: "Review Request Automation",
    short: "A simple system to request reviews automatically after a service.",
    description:
      "A practical workflow that helps you consistently earn more Google reviews without chasing customers manually. We set it up, test it, and keep it easy to run.",
    whoFor:
      "Businesses that want more reviews and stronger reputation in local search.",
    included: [
      "Review request setup",
      "Follow-up flow",
      "Direct Google review link setup",
      "Basic automation setup",
      "Workflow testing",
    ],
    outcome: "More recent reviews that help you win the next booking.",
    pricingLines: ["Starting at $299 one-time", "Optional ongoing support: starting at $100/month"],
    pricingNote:
      "Optional support can include monitoring, reputation support, monthly checks, and basic reporting.",
    href: "/services#review-automation",
    ctaLabel: "See Details",
  },
  {
    id: "social-presence",
    name: "Social Presence Management",
    short: "Stay active and look professional online without the hassle.",
    description:
      "Light but effective social media management focused on consistency and trust. You provide raw photos/videos/updates—BookedLoop turns them into polished branded content ready to post.",
    whoFor:
      "Businesses that want to stay visible and credible online with consistent posting.",
    included: [
      "Monthly content planning",
      "Branded post designs",
      "Captions",
      "Scheduling support",
      "Profile optimization",
      "Monthly content organization",
    ],
    outcome: "A consistent presence that supports bookings and referrals.",
    pricingLines: ["Starting at $349/month"],
    pricingNote:
      "You provide raw photos, videos, offers, updates, and business content each month. BookedLoop turns that into branded posts and captions.",
    href: "/services#social-presence",
    ctaLabel: "See Details",
  },
  {
    id: "crm-followup",
    name: "CRM + Lead Follow-Up",
    short: "Track inquiries, follow up faster, and stop losing leads.",
    description:
      "A simple system to track inquiries, manage leads, and follow up consistently. Designed for small teams—clear stages, reminders, and templates.",
    whoFor:
      "Businesses getting inquiries from calls, forms, DMs, or ads and want a simple follow-up process.",
    included: [
      "Lead capture setup",
      "Inquiry tracking",
      "Follow-up reminder system",
      "Basic lead pipeline",
      "Appointment tracking",
      "Message templates",
      "Review request step",
      "Walkthrough / setup support",
    ],
    outcome: "More booked appointments from the leads you already get.",
    pricingLines: ["Starting at $499 one-time", "Optional ongoing support: starting at $100/month"],
    pricingNote:
      "Optional support can include automation checks, reminder flow updates, lead tracking support, minor workflow improvements, and basic reporting.",
    href: "/services#crm-followup",
    ctaLabel: "See Details",
  },
  {
    id: "gbp-optimization",
    name: "Google Business Profile Optimization",
    short: "Make your Google profile look stronger and more trustworthy.",
    description:
      "We improve your Google Business Profile so it’s cleaner, more complete, and aligned with what nearby customers search. This helps you look more credible in Maps and local results.",
    whoFor:
      "Businesses that rely on local discovery and want more calls from Google Maps.",
    included: [
      "Profile cleanup",
      "Service/category optimization",
      "Business info improvements",
      "Profile polish",
      "Suggestions for stronger local presence",
    ],
    outcome: "More inbound calls and fewer “just browsing” leads.",
    pricingLines: ["Starting at $199 one-time", "Optional ongoing support: starting at $100/month"],
    pricingNote:
      "Optional support can include monitoring, updates, local visibility support, review support guidance, and monthly check-ins.",
    href: "/services#gbp-optimization",
    ctaLabel: "See Details",
  },
  {
    id: "local-seo",
    name: "Local SEO Support",
    short: "Basic local SEO support to help you show up for nearby searches.",
    description:
      "A straightforward SEO service focused on local visibility. We prioritize practical improvements that help nearby customers find the services you provide.",
    whoFor:
      "Businesses that want steady local traffic without chasing ads forever.",
    included: [
      "Local keyword targeting",
      "Page optimization",
      "Service area improvements",
      "Basic on-page SEO",
      "Local content suggestions",
    ],
    outcome: "More qualified local traffic and stronger visibility.",
    pricingLines: ["Starting at $249/month"],
    href: "/services#local-seo",
    ctaLabel: "See Details",
  },
  {
    id: "growth-campaigns",
    name: "Growth Campaigns",
    short: "Simple campaigns to bring back customers and promote offers.",
    description:
      "Practical marketing campaigns designed to keep you visible and generate bookings—without complicated funnels. Great for promos, reactivation, reminders, and seasonal pushes.",
    whoFor:
      "Businesses that want to run simple offers and stay top-of-mind with past customers and leads.",
    included: [
      "Promotional campaigns",
      "Reactivation campaigns",
      "Reminder campaigns",
      "Repeat-customer campaigns",
      "Seasonal campaigns",
      "Referral-style campaigns",
    ],
    outcome: "More repeat bookings and better visibility for timely offers.",
    pricingLines: ["Starting at $250 per campaign"],
    pricingNote:
      "Optional monthly campaign support can be offered as a custom retainer.",
    href: "/services#growth-campaigns",
    ctaLabel: "See Details",
  },
];
