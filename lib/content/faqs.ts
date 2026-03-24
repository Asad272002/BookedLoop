export type FaqItem = {
  question: string;
  answer: string;
};

export const faqs: FaqItem[] = [
  {
    question: "What is a Free Audit?",
    answer:
      "A short review of your current website, booking flow, reviews, and follow-up process. You’ll get clear priorities and a practical next-step plan—no pressure.",
  },
  {
    question: "Do you work with my type of business?",
    answer:
      "BookedLoop is built for local service businesses: salons, clinics, barbers, fitness studios, tutors, home services, repair shops, and similar industries.",
  },
  {
    question: "Do you manage booking software too?",
    answer:
      "We help you choose the right booking approach and set up the flow so it’s easy for customers to book. If you already have a booking tool, we optimize around it.",
  },
  {
    question: "Can you do this without changing everything I already use?",
    answer:
      "Yes. The goal is fewer moving parts, not more. We can improve your existing setup first, then rebuild only where it’s worth it.",
  },
  {
    question: "How do I get started?",
    answer:
      "Book a Free Audit. We’ll look at what you have, identify what’s costing you leads, and outline a clean plan to increase bookings and reviews.",
  },
];

export const industries = [
  "Salons & spas",
  "Barbershops",
  "Clinics & wellness",
  "Fitness studios",
  "Home services",
  "Repair shops",
  "Tutors & lessons",
  "Local professional services",
] as const;
