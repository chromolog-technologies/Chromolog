import { useEffect } from "react";
import { servicesData } from "../data/servicesData";

const BASE_URL = "https://chromologtechnologies.com";

const staticMeta = {
  home: {
    title: "Custom Software Development Company in Kerala | Chromolog Technologies",
    description: "Chromolog is a Kochi-based custom software company building web apps, CRM, ERP, HRMS and business automation for growing businesses in Kerala, Dubai and UAE.",
    path: "/",
  },
  services: {
    title: "Software Development Services in Kerala | Web, CRM, ERP, HRMS | Chromolog",
    description: "Explore Chromolog services: custom software, web applications, website redesign, mobile apps, CRM, ERP, HRMS, LMS and business automation in Kerala & Dubai.",
    path: "/services",
  },
  "case-studies": {
    title: "Software Case Studies in Kerala & Dubai | Chromolog Technologies",
    description: "See how Chromolog delivered custom software, CRM, HRMS and web platforms that cut manual work and improved operations for real clients.",
    path: "/case-studies",
  },
  "free-consultation": {
    title: "Free Software Consultation in Kerala | Chromolog Technologies",
    description: "Book a free 30-minute consultation with Chromolog. Audit your workflows and plan custom software, CRM, or website upgrades for your business.",
    path: "/free-consultation",
  },
  products: {
    title: "Business Software Products & Platforms | Chromolog Technologies",
    description: "Explore Chromolog products: AI-ready SaaS platforms, HRMS, campus systems and automation tools engineered for growing enterprises.",
    path: "/products",
  },
  blog: {
    title: "Software & Digital Transformation Blog | Chromolog Technologies",
    description: "Practical guides on custom software, CRM vs SaaS, website redesign, HRMS and business automation for Kerala and UAE companies.",
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
    title: "Software Development Company in Kochi | Custom Web Apps & CRM | Chromolog",
    description: "Chromolog Technologies is a software development company in Kochi building custom web apps, CRM, HRMS and business automation for Infopark and Kerala enterprises.",
  },
  kerala: {
    title: "Custom Software Development Company in Kerala | Chromolog Technologies",
    description: "Hire Chromolog for custom software, website redesign, CRM and HRMS in Kerala. Replace Excel and WhatsApp workflows with cloud systems you own.",
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
    title: "Custom Software Development Company in Kerala | Chromolog Technologies",
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
