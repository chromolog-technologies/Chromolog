// ─── Products Page ───────────────────────────────────────────────────────────
// The Chromolog product ecosystem: an immersive, Apple-style showcase of SaaS,
// enterprise and AI products. Orchestrates all product sections, the shared
// detail modal, and the filter/search state. Page-level SEO + smooth entrance.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import ProductsHero from "../components/products/ProductsHero";
import ProductFilters from "../components/products/ProductFilters";
import FeaturedProducts from "../components/products/FeaturedProducts";
import EnterpriseSolutions from "../components/products/EnterpriseSolutions";
import IndustrySolutions from "../components/products/IndustrySolutions";
import AIProducts from "../components/products/AIProducts";
import ComingSoon from "../components/products/ComingSoon";
import ProductTechOrbit from "../components/products/ProductTechOrbit";
import DevelopmentPhilosophy from "../components/products/DevelopmentPhilosophy";
import ProductRoadmap from "../components/products/ProductRoadmap";
import ProductsCTA from "../components/products/ProductsCTA";
import ProductModal from "../components/products/ProductModal";

import { FEATURED_PRODUCTS } from "../data/products";
import { easings } from "../motion/easings";
import { trackEvent } from "../utils/analytics";

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Reusable section shell (eyebrow + title + subtitle) ──────────────────────
function SectionShell({ id, eyebrow, title, subtitle, children, className = "", tint }) {
  return (
    <section id={id} className={`prod-section ${className}`}>
      {tint && <div className={`prod-section-tint prod-section-tint--${tint}`} aria-hidden="true" />}
      <div className="prod-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 22, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.6, ease: easings.expo }}
          className="prod-section-head"
        >
          {eyebrow && (
            <span className="prod-eyebrow">
              <Sparkles className="h-3 w-3" />
              {eyebrow}
            </span>
          )}
          <h2 className="prod-section-title">{title}</h2>
          {subtitle && <p className="prod-section-sub">{subtitle}</p>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

export default function Products({ navigateToSection, setActivePage }) {
  const [modalProduct, setModalProduct] = useState(null);
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState("all");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("all");
  const enterpriseRef = useRef(null);

  // ── SEO meta ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Products — AI Software, SaaS & Enterprise Platforms | Chromolog Technologies";
    const setMeta = (name, content, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel);
      if (!el) {
        el = document.createElement("meta");
        prop ? el.setAttribute("property", name) : el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta(
      "description",
      "Explore Chromolog Technologies' products — AI-powered SaaS, enterprise HRMS, education ERP, healthcare software, CRM and business automation platforms built to scale worldwide."
    );
    setMeta(
      "keywords",
      "AI software company, enterprise software, SaaS development, healthcare software, education ERP, HRMS, CRM development, custom software, hospital management software, business automation"
    );
    setMeta("og:title", "Products — Chromolog Technologies", true);
    setMeta("og:description", "AI-first SaaS and enterprise products engineered to scale businesses worldwide.", true);
    setMeta("og:type", "website", true);
    setMeta("og:url", "https://chromologtech.com/products", true);

    // Structured data: ItemList of products
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = "products-jsonld";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Chromolog Technologies Products",
      itemListElement: FEATURED_PRODUCTS.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "SoftwareApplication",
          name: p.name,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: p.description,
        },
      })),
    });
    document.head.appendChild(ld);

    window.scrollTo({ top: 0, behavior: "auto" });

    return () => {
      document.title = prevTitle;
      document.getElementById("products-jsonld")?.remove();
    };
  }, []);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FEATURED_PRODUCTS.filter((p) => {
      if (quick !== "all") {
        const inTags = p.tags?.includes(quick);
        const inIndustries = p.industries?.includes(quick);
        if (!inTags && !inIndustries) return false;
      }
      if (category !== "All" && p.category !== category) return false;
      if (status !== "all" && p.status !== status) return false;
      if (q) {
        const hay = [
          p.name, p.category, p.tagline, p.description,
          ...(p.tech || []), ...(p.features || []),
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, quick, category, status]);

  const resetFilters = () => {
    setQuery(""); setQuick("all"); setCategory("All"); setStatus("all");
  };

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: y, behavior: prefersReduced ? "auto" : "smooth" });
  };

  const goContact = () => {
    // Leave the products page and land on the home contact section
    setActivePage?.("home");
    window.history.pushState({}, "", "/");
    if (navigateToSection) navigateToSection("contact");
  };

  const openProduct = (p) => {
    setModalProduct(p);
    trackEvent("Products", "product_open", p.id);
  };

  const requestDemo = (p) => {
    trackEvent("Products", "product_demo", p?.id || "");
    setModalProduct(null);
    goContact();
  };

  const selectIndustry = () => scrollTo("enterprise-solutions");

  // Page-level enter/exit is handled by <PageTransition> in App.jsx.
  return (
    <div className="relative">
      {/* HERO */}
      <ProductsHero onExplore={() => scrollTo("featured-products")} onDemo={goContact} />

      {/* FEATURED PRODUCTS + FILTERS */}
      <SectionShell
        id="featured-products"
        eyebrow="Featured Products"
        title="Flagship products, built to scale"
        subtitle="Our most-loved platforms — from live SaaS to enterprise systems and next-gen AI concepts. Filter, search, and dive into any product."
        tint="primary"
      >
        <ProductFilters
          query={query} setQuery={setQuery}
          quick={quick} setQuick={setQuick}
          category={category} setCategory={setCategory}
          status={status} setStatus={setStatus}
          resultCount={filtered.length}
          onReset={resetFilters}
        />
        <div className="mt-10">
          <FeaturedProducts products={filtered} onOpen={openProduct} />
        </div>
      </SectionShell>

      {/* ENTERPRISE SOLUTIONS */}
      <SectionShell
        id="enterprise-solutions"
        eyebrow="Enterprise Solutions"
        title="Solutions engineered by industry"
        subtitle="Select an industry to explore the products, technologies and business outcomes we deliver for it."
      >
        <div ref={enterpriseRef}>
          <EnterpriseSolutions />
        </div>
      </SectionShell>

      {/* INDUSTRY SOLUTIONS (breadth grid) */}
      <SectionShell
        id="industry-solutions"
        eyebrow="Industry Solutions"
        title="Nine industries, one product partner"
        subtitle="From healthcare to logistics, our platforms are tuned to the realities of each vertical."
        tint="secondary"
      >
        <IndustrySolutions onSelect={selectIndustry} />
      </SectionShell>

      {/* AI PRODUCTS */}
      <SectionShell
        id="ai-products"
        eyebrow="AI Products"
        title="An AI toolkit for real business problems"
        subtitle="Production-grade AI building blocks — from resume analysis to document intelligence — ready to embed in your workflows."
        tint="purple"
      >
        <AIProducts />
      </SectionShell>

      {/* COMING SOON */}
      <SectionShell
        id="coming-soon"
        eyebrow="Coming Soon"
        title="What we're building next"
        subtitle="A look at the products on our roadmap. Want early access? Let's talk."
      >
        <ComingSoon />
      </SectionShell>

      {/* TECHNOLOGY ORBIT */}
      <SectionShell
        id="technology"
        eyebrow="Technology Stack"
        title="The engineering that powers every product"
        subtitle="Hover any node to pause the orbit and explore the technologies behind our platforms."
        tint="primary"
      >
        <ProductTechOrbit />
      </SectionShell>

      {/* DEVELOPMENT PHILOSOPHY */}
      <SectionShell
        id="philosophy"
        eyebrow="Development Philosophy"
        title="How we build products that last"
        subtitle="Principles that shape every decision — from first sketch to production scale."
      >
        <DevelopmentPhilosophy />
      </SectionShell>

      {/* ROADMAP */}
      <SectionShell
        id="roadmap"
        eyebrow="Product Roadmap"
        title="Where the ecosystem is headed"
        subtitle="Our public product roadmap across the coming quarters."
        tint="secondary"
      >
        <ProductRoadmap />
      </SectionShell>

      {/* CTA */}
      <section className="prod-section">
        <div className="prod-container">
          <ProductsCTA onConsult={goContact} onDemo={goContact} onQuote={goContact} />
        </div>
      </section>

      {/* DETAIL MODAL */}
      <ProductModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onDemo={requestDemo}
      />
    </div>
  );
}
