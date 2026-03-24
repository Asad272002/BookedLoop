export type PricingPackage = {
  id: string;
  name: string;
  label: string;
  priceLines: string[];
  description: string;
  highlights: string[];
  recommended?: boolean;
};

export const pricing = {
  note:
    "Custom bundles are available. Final pricing may vary depending on business size, number of locations, and service needs.",
  packages: [
    {
      id: "pkg-website-setup",
      name: "Website Setup",
      label: "One-time",
      priceLines: ["$500 one-time", "Booking add-on: +$200 one-time", "Optional support: $100/month"],
      description:
        "A clean, professional website that helps customers understand your business and take action.",
      highlights: [
        "Mobile-friendly website",
        "Homepage + key sections",
        "Contact form + click-to-call/WhatsApp",
        "Basic SEO setup + launch support",
      ],
    },
    {
      id: "pkg-reviews",
      name: "Review Request Automation",
      label: "One-time",
      priceLines: ["Starting at $299 one-time", "Optional ongoing support: starting at $100/month"],
      description:
        "A simple system that automatically requests reviews after a service, plus optional reputation support.",
      highlights: [
        "Review request + follow-up flow",
        "Direct Google review link setup",
        "Basic automation setup",
        "Workflow testing",
      ],
    },
    {
      id: "pkg-social",
      name: "Social Presence Management",
      label: "Monthly",
      priceLines: ["Starting at $349/month"],
      description:
        "Light but effective social management so you stay active and look professional online.",
      highlights: [
        "Monthly content planning",
        "Branded post designs + captions",
        "Scheduling support",
        "Profile optimization",
      ],
    },
    {
      id: "pkg-crm",
      name: "CRM + Lead Follow-Up",
      label: "One-time",
      priceLines: ["Starting at $499 one-time", "Optional ongoing support: starting at $100/month"],
      description:
        "A simple system to track inquiries, manage leads, follow up faster, and avoid losing potential customers.",
      highlights: [
        "Lead capture + inquiry tracking",
        "Follow-up reminders + templates",
        "Basic lead pipeline + appointment tracking",
        "Walkthrough / setup support",
      ],
    },
    {
      id: "pkg-gbp",
      name: "Google Business Profile Optimization",
      label: "One-time",
      priceLines: ["Starting at $199 one-time", "Optional ongoing support: starting at $100/month"],
      description:
        "Improve your Google profile so it looks stronger and more trustworthy in local search.",
      highlights: [
        "Profile cleanup",
        "Service/category optimization",
        "Business info improvements",
        "Suggestions for stronger local presence",
      ],
    },
    {
      id: "pkg-local-seo",
      name: "Local SEO Support",
      label: "Monthly",
      priceLines: ["Starting at $249/month"],
      description:
        "Basic local SEO support to help you show up better when nearby customers search for your services.",
      highlights: [
        "Local keyword targeting",
        "Page optimization",
        "Service area improvements",
        "Local content suggestions",
      ],
    },
    {
      id: "pkg-growth-campaigns",
      name: "Growth Campaigns",
      label: "Per campaign",
      priceLines: ["Starting at $250 per campaign"],
      description:
        "Simple marketing campaigns to bring back customers, promote offers, and help you stay visible.",
      highlights: [
        "Promotional campaigns",
        "Reactivation campaigns",
        "Seasonal + reminder campaigns",
        "Referral-style campaigns",
      ],
    },
    {
      id: "bundle-growth-engine",
      name: "Growth Engine Bundle",
      label: "Monthly",
      priceLines: ["Starting at $699/month"],
      description:
        "One connected growth system instead of separate disconnected services.",
      highlights: [
        "Website support",
        "Booking support",
        "Review automation",
        "Social presence support",
        "Lead follow-up tools",
      ],
      recommended: true,
    },
  ] satisfies PricingPackage[],
} as const;
