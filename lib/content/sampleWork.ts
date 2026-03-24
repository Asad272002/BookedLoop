export type SampleWorkItem = {
  id: string;
  label: "Sample Project" | "Demo Case Study" | "Example Workflow" | "Demo Funnel" | "Example Booking Setup";
  title: string;
  industry: string;
  overview: string;
  whatWeBuilt: string[];
  focus: string[];
  disclaimer?: string;
};

export const sampleWork: SampleWorkItem[] = [
  {
    id: "sample-salon-booking",
    label: "Sample Project",
    title: "Salon Website + Booking Flow Refresh",
    industry: "Salon / Beauty",
    overview:
      "A clean redesign focused on clear services, availability, and a booking-first layout that reduces “DM to book” friction.",
    whatWeBuilt: [
      "Homepage + services pages with strong CTAs",
      "Booking flow guidance + button placement",
      "FAQ + policy section to cut down repetitive questions",
      "Mobile speed + readability improvements",
    ],
    focus: ["Bookings", "Clarity", "Mobile"],
    disclaimer:
      "This is a demo concept to show how BookedLoop structures booking-first sites. Replace with a real project when available.",
  },
  {
    id: "demo-clinic-reviews",
    label: "Demo Case Study",
    title: "Review Request System + Follow-Up Templates",
    industry: "Clinic / Wellness",
    overview:
      "A simple workflow that sends review requests at the right moment and follows up once—without sounding pushy.",
    whatWeBuilt: [
      "Timing strategy + message templates",
      "Google review link routing plan",
      "Simple segmentation suggestions",
      "Optional no-show reduction reminders",
    ],
    focus: ["Reviews", "Reputation", "Retention"],
    disclaimer:
      "Demonstration workflow. Use it as a blueprint and swap in real results later.",
  },
  {
    id: "example-home-services-growth-campaign",
    label: "Example Workflow",
    title: "Growth Campaign Blueprint",
    industry: "Home Services / Repair",
    overview:
      "A simple campaign concept to bring back past customers, promote an offer, and turn “maybe later” leads into bookings.",
    whatWeBuilt: [
      "Offer positioning + copy blocks",
      "Email/SMS-ready sequence outline",
      "Response handling suggestions",
      "Tracking checklist",
    ],
    focus: ["Campaigns", "Follow-Up", "Fill the calendar"],
    disclaimer:
      "Example workflow only. No client claims or metrics—replace with real case studies when ready.",
  },
];
