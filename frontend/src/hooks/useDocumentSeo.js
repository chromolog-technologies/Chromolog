import { useEffect } from "react";
import { servicesData } from "../data/servicesData";

const BASE_URL = "https://chromologtechnologies.com";

const staticMeta = {
  home: {
    title: "Custom Software & Digital Systems | Chromolog Technologies",
    description: "Chromolog Technologies builds custom software, web applications, CRM, ERP & HRMS systems to automate processes and scale growing businesses.",
    path: "/",
  },
  services: {
    title: "Enterprise Software & Web Development Services | Chromolog Technologies",
    description: "Explore our end-to-end digital engineering services: custom software development, web applications, mobile apps, CRM, ERP, and HRMS systems.",
    path: "/services",
  },
  "case-studies": {
    title: "Case Studies & Client Proven ROI | Chromolog Technologies",
    description: "Read real-world case studies of digital systems, bespoke software, CRM, and ERP applications developed by Chromolog Technologies.",
    path: "/case-studies",
  },
  "free-consultation": {
    title: "Book Free Technology Consultation | Chromolog Technologies",
    description: "Schedule a 30-minute free technology discovery session with our lead software architects. Audit your workflow and plan your custom software.",
    path: "/free-consultation",
  },
  products: {
    title: "Products — AI Software, SaaS & Enterprise Platforms | Chromolog Technologies",
    description: "Discover proprietary digital platforms and business automation software engineered by Chromolog Technologies.",
    path: "/products",
  },
  blog: {
    title: "Technology Insights & Engineering Blog | Chromolog Technologies",
    description: "In-depth insights, architecture guides, and software engineering articles on custom CRM, ERP, web applications, and business automation.",
    path: "/blog",
  },
  careers: {
    title: "Careers — Join Our Engineering Team | Chromolog Technologies",
    description: "Explore open career opportunities for React, Laravel, full-stack developers, and UI/UX designers at Chromolog Technologies in Kochi, Kerala.",
    path: "/careers",
  },
  privacy: {
    title: "Privacy Policy | Chromolog Technologies",
    description: "Learn how Chromolog Technologies collects, protects, and handles your data in accordance with international privacy regulations.",
    path: "/privacy",
  },
  terms: {
    title: "Terms of Service | Chromolog Technologies",
    description: "Review the terms, conditions, and intellectual property ownership policies for Chromolog Technologies digital solutions.",
    path: "/terms",
  },
};

const locationsMeta = {
  kochi: {
    title: "Custom Software & Web Application Development Company in Kochi | Chromolog",
    description: "Chromolog Technologies engineers custom software, web applications, CRM, HRMS, and business automation systems for growing enterprises in Kochi and Infopark.",
  },
  kerala: {
    title: "Software Development & Business Automation Company in Kerala | Chromolog",
    description: "Chromolog helps Kerala businesses transition from manual Excel spreadsheets and legacy websites to modern cloud software.",
  },
  dubai: {
    title: "Custom Software & Web Development Company in Dubai, UAE | Chromolog",
    description: "Chromolog delivers high-performance digital systems, web apps, and enterprise business software for organizations across Dubai and the UAE.",
  },
  uae: {
    title: "Enterprise Software & Cloud Systems Engineering in UAE | Chromolog",
    description: "Chromolog designs scalable cloud software, mobile apps, and custom enterprise portals tailored for businesses operating across the United Arab Emirates.",
  },
};

const industriesMeta = {
  healthcare: {
    title: "Healthcare Software & Hospital HRMS Systems | Chromolog Technologies",
    description: "Chromolog engineers clinical workflow software, patient portals, biometric shift HRMS, and offline-first mobile tools for hospitals and clinics.",
  },
  education: {
    title: "Smart Campus ERP & Learning Management Systems (LMS) | Chromolog Technologies",
    description: "Chromolog builds custom LMS platforms, student portals, online quiz engines, and fee collection workflows for schools and academies.",
  },
  "real-estate": {
    title: "Custom Real Estate CRM & Property Lead Systems | Chromolog Technologies",
    description: "Centralize property listings, lead management pipelines, agent follow-ups, and WhatsApp API notifications for real estate developers.",
  },
  retail: {
    title: "Retail Inventory, POS & Multi-Branch CRM Systems | Chromolog Technologies",
    description: "Unify stock tracking, branch order dispatch, billing, and customer loyalty management into a single high-performance web application.",
  },
  manufacturing: {
    title: "Manufacturing ERP & Production Operations Systems | Chromolog Technologies",
    description: "Digitize purchase requisitions, raw material inventory, work-in-progress tracking, and automated executive reporting.",
  },
  hospitality: {
    title: "Hospitality Automation & Hotel/Dining Systems | Chromolog Technologies",
    description: "Connect QR digital menus, kitchen display units, billing, inventory, and staff rosters into a fast, unified cloud system.",
  },
};

function getMetadataForPage(activePage) {
  if (!activePage || activePage === "home") {
    return staticMeta.home;
  }

  // 1. Service Detail
  if (activePage.startsWith("services/")) {
    const slug = activePage.replace("services/", "");
    const svc = servicesData[slug];
    if (svc) {
      return {
        title: svc.metaTitle || `${svc.h1} | Chromolog Technologies`,
        description: svc.metaDescription || (svc.hero && svc.hero.solution) || staticMeta.services.description,
        path: `/services/${slug}`,
      };
    }
  }

  // 2. Location Pages
  if (activePage.startsWith("locations/")) {
    const slug = activePage.replace("locations/", "");
    const loc = locationsMeta[slug] || locationsMeta.kochi;
    return {
      title: loc.title,
      description: loc.description,
      path: `/locations/${slug}`,
    };
  }

  // 3. Industry Pages
  if (activePage.startsWith("industries/")) {
    const slug = activePage.replace("industries/", "");
    const ind = industriesMeta[slug] || industriesMeta.healthcare;
    return {
      title: ind.title,
      description: ind.description,
      path: `/industries/${slug}`,
    };
  }

  // 4. Static core routes
  if (staticMeta[activePage]) {
    return staticMeta[activePage];
  }

  // Default fallback
  const cleanPath = activePage.startsWith("/") ? activePage : `/${activePage}`;
  return {
    title: "Custom Software & Digital Systems | Chromolog Technologies",
    description: staticMeta.home.description,
    path: cleanPath,
  };
}

export default function useDocumentSeo(activePage) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const meta = getMetadataForPage(activePage);
    const canonicalUrl = meta.path === "/" ? BASE_URL + "/" : `${BASE_URL}${meta.path}`;

    // Update document.title
    document.title = meta.title;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", meta.description);

    // Update Self-Referencing Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    // Update Open Graph tags
    const setMetaProp = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMetaProp("og:title", meta.title);
    setMetaProp("og:description", meta.description);
    setMetaProp("og:url", canonicalUrl);

    // Update Twitter Card tags
    const setMetaName = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMetaName("twitter:title", meta.title);
    setMetaName("twitter:description", meta.description);
  }, [activePage]);
}
