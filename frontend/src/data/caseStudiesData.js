// ─── Case Studies Data ──────────────────────────────────────────────────────
// Only real, verifiable client work belongs here. Add new entries when a client
// project is delivered (with the client's permission to name them).

export const caseStudiesData = [
  {
    id: "gmc-chest-hospital-token-system",
    slug: "gmc-chest-hospital-token-system",
    title: "Online Token Booking & Queue System for GMC Chest Hospital",
    client: "GMC Chest Hospital, Thrissur",
    industry: "Healthcare",
    service: "Mobile App & Custom Software",
    location: "Thrissur, Kerala",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
    challenge: {
      title: "Before Chromolog: Physical Queues",
      points: [
        "Patients had to queue in person to get a token for treatment.",
        "Online, walk-in and staff bookings had no fair, shared system.",
        "Doctors had no live view of their unit's patient queue.",
      ],
    },
    solution: {
      title: "What Chromolog Built",
      desc: "A Flutter patient app for booking tokens, a doctor app to call patients in order, and a React admin dashboard, all on a Laravel API with Firebase push notifications.",
    },
    features: [
      "Online Token Booking for Chemo & Follow-up",
      "Doctor Queue with Call Next",
      "Walk-in & Staff Token Booking",
      "Admin Dashboard for Units, Doctors & Patients",
      "Push Alerts When a Token Is Called",
    ],
    results: [
      { metric: "3", label: "Connected Apps" },
      { metric: "~300", label: "Tokens per Unit per Day" },
      { metric: "1", label: "Token per Patient per Day" },
      { metric: "Live", label: "On Google Play" },
    ],
    qualitativeResult: "Patients book their token from their phone and get an alert when it is called, instead of waiting in a physical queue.",
    links: [
      { label: "Visit the live system", href: "https://gmcchtsrtoken.com/" },
      { label: "Get the app on Google Play", href: "https://play.google.com/store/apps/details?id=gmcch.vast.token" },
    ],
  },
];
