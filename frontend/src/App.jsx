import { useState, useEffect, lazy, Suspense, Component } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence } from "framer-motion";

import ProblemSection from "./components/ProblemSection";
import ExecutiveSummary from "./components/ExecutiveSummary";
import DigitalAuditModal from "./components/DigitalAuditModal";
import MobileStickyBar from "./components/MobileStickyBar";

// Critical above-the-fold components
import Header from "./components/Header";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import CursorFollower from "./components/CursorFollower";
import AIChat from "./components/AIChat";
import CookieConsent from "./components/CookieConsent";
import PageLoader from "./components/PageLoader";
import ScrollProgress from "./components/motion/ScrollProgress";
import PageTransition from "./components/motion/PageTransition";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import LeadsManager from "./pages/admin/LeadsManager";
import AnalyticsOverview from "./pages/admin/AnalyticsOverview";

// Lazy-loaded below-the-fold home sections & pages
const BusinessCore = lazy(() => import("./components/BusinessCore"));
const Services = lazy(() => import("./components/Services"));
const WebsiteRescue = lazy(() => import("./components/WebsiteRescue"));
const ChromologMethod = lazy(() => import("./components/ChromologMethod"));
const Projects = lazy(() => import("./components/Projects"));
const WhoWeHelp = lazy(() => import("./components/WhoWeHelp"));
const About = lazy(() => import("./components/About"));
const AIShowcase = lazy(() => import("./components/AIShowcase"));
const ProductMockup = lazy(() => import("./components/ProductMockup"));
const Process = lazy(() => import("./components/Process"));
const Testimonials = lazy(() => import("./components/Testimonials"));
const Contact = lazy(() => import("./components/Contact"));
// Lazy-loaded pages (reduces main bundle chunk)
const Blog = lazy(() => import("./pages/Blog"));
const Recommendations = lazy(() => import("./components/Recommendations"));
const Products = lazy(() => import("./pages/Products"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Careers = lazy(() => import("./pages/Careers"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ServerError = lazy(() => import("./pages/ServerError"));
const Offline = lazy(() => import("./pages/Offline"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const ServicesIndex = lazy(() => import("./pages/ServicesIndex"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const FreeConsultation = lazy(() => import("./pages/FreeConsultation"));
const AdminPortal = lazy(() => import("./pages/admin/AdminPortal"));
const LocationPage = lazy(() => import("./pages/LocationPage"));
const IndustryPage = lazy(() => import("./pages/IndustryPage"));
// Lazy-loaded heavy components
const TechOrbit = lazy(() => import("./components/TechOrbit"));
const IndustryExplorer = lazy(() => import("./components/IndustryExplorer"));

// Analytics hooks
import useScrollDepth from "./hooks/useScrollDepth";
import useTimeOnPage from "./hooks/useTimeOnPage";
import useVisitorIntelligence from "./hooks/useVisitorIntelligence";
import { trackPageView, trackWhatsApp } from "./utils/analytics";

const WHATSAPP_URL = "https://wa.me/919400230723?text=Hi%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// ─── Reduced Motion Detector ────────────────────────────────────────
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Section Loading Skeleton ───────────────────────────────────────
function SectionSkeleton() {
  return (
    <div className="w-full py-20 flex items-center justify-center" aria-hidden="true">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-accent/60 animate-spin" />
    </div>
  );
}

// ─── Error Boundary ─────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[Chromolog ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-6xl font-heading font-extrabold bg-gradient-to-b from-white/15 to-white/[0.03] bg-clip-text text-transparent mb-6">
              500
            </div>
            <h2 className="text-xl font-heading font-bold text-white mb-3">
              Something went wrong
            </h2>
            <p className="text-muted-text text-sm font-body mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-heading font-bold hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Main App ───────────────────────────────────────────────────────
export default function App() {
  const [activePage, setActivePage] = useState(() => {
    if (typeof window === "undefined") return "home";
    const path = window.location.pathname.replace(/^\/+/, "");
    return path || "home";
  });
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(() => {
    // Only show cinematic loader once per session
    if (typeof window !== "undefined" && sessionStorage.getItem("chromolog_loaded")) {
      return false;
    }
    return true;
  });

  // Analytics hooks
  useScrollDepth(activePage);
  useTimeOnPage();
  useVisitorIntelligence(activePage);

  // Track SPA page views
  useEffect(() => {
    const pagePath = activePage === "home" ? "/" : `/${activePage}`;
    trackPageView(pagePath);
  }, [activePage]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+/, "");
      setActivePage(path || "home");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Handle cinematic loader completion
  const handleLoaderComplete = () => {
    setIsLoading(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("chromolog_loaded", "1");
    }
  };

  useEffect(() => {
    // Skip smooth scroll for reduced motion
    if (prefersReducedMotion) return;

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    // Sync Lenis scroll events with ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Bind Lenis animation frame loop to GSAP ticker
    const lenisTicker = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(lenisTicker);

    gsap.ticker.lagSmoothing(0);

    // Initialize ScrollTrigger reveal animations for elements with '.reveal' class
    if (!prefersReducedMotion) {
      const revealElements = document.querySelectorAll(".reveal");
      revealElements.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 35, filter: "blur(6px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }

    // Scroll to saved section if returning to home
    if (activePage === "home") {
      const target = sessionStorage.getItem("scrollTarget");
      if (target) {
        sessionStorage.removeItem("scrollTarget");
        setTimeout(() => {
          const el = document.getElementById(target);
          if (el) {
            lenis.scrollTo(el, { offset: -80, duration: 1.2 });
          }
        }, 150);
      }
    }

    const handleScrollRequest = (e) => {
      const el = document.getElementById(e.detail.id);
      if (el) lenis.scrollTo(el, { offset: -80, duration: 1.2 });
    };
    window.addEventListener("chromolog:scrollTo", handleScrollRequest);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenisTicker);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      window.removeEventListener("chromolog:scrollTo", handleScrollRequest);
    };
  }, [activePage]);

  const navigateToSection = (sectionId) => {
    if (activePage !== "home") {
      setActivePage("home");
      window.history.pushState({}, "", "/");
      sessionStorage.setItem("scrollTarget", sectionId);
    } else {
      window.dispatchEvent(
        new CustomEvent("chromolog:scrollTo", { detail: { id: sectionId } })
      );
    }
  };

  const isServiceDetail = activePage.startsWith("services/");
  const serviceSlug = isServiceDetail ? activePage.replace("services/", "") : null;

  const isLocationPage = activePage.startsWith("locations/");
  const locationSlug = isLocationPage ? activePage.replace("locations/", "") : null;

  const isIndustryPage = activePage.startsWith("industries/");
  const industrySlug = isIndustryPage ? activePage.replace("industries/", "") : null;

  return (
    <AuthProvider>
    <div className="relative min-h-screen bg-bg-dark text-white-text overflow-hidden font-body selection:bg-primary/30 selection:text-white">
      {/* Scroll Progress Bar */}
      {activePage === "home" && <ScrollProgress />}

      {/* Accessibility: Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Cinematic Loading Screen */}
      <AnimatePresence>
        {isLoading && <PageLoader onComplete={handleLoaderComplete} />}
      </AnimatePresence>

      {/* Background Neural Grid and Noise overlays */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
      <div className="absolute inset-0 noise-overlay opacity-[0.012] pointer-events-none z-0" />

      {/* Ambient Floating Glowing Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] pointer-events-none z-0 animate-orb-float" />
      <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-secondary/8 blur-[100px] pointer-events-none z-0 animate-orb-float-slow" />
      <div className="absolute bottom-[10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-purple-glow/6 blur-[110px] pointer-events-none z-0 animate-orb-float" />

      {/* Custom Cursor Blur Glow Trail */}
      <CursorFollower />

      {/* Sticky Header Navigation (Hidden on Admin Dashboard) */}
      {activePage !== "admin" && (
        <Header
          activePage={activePage}
          setActivePage={setActivePage}
          navigateToSection={navigateToSection}
        />
      )}

      {/* Main Content Area */}
      <ErrorBoundary>
        <main id="main-content" className={`relative z-10 ${activePage === "admin" ? "" : "pt-20"}`}>
          <AnimatePresence mode="wait">
          <PageTransition key={activePage}>
          {activePage === "home" && (
            <>
              <Hero navigateToSection={navigateToSection} />
              <ExecutiveSummary setActivePage={setActivePage} />
              <ProblemSection onOpenAudit={() => setIsAuditModalOpen(true)} navigateToSection={navigateToSection} />
              <Suspense fallback={<SectionSkeleton />}>
                <BusinessCore navigateToSection={navigateToSection} onOpenAudit={() => setIsAuditModalOpen(true)} />
                <Services setActivePage={setActivePage} />
                <WebsiteRescue setActivePage={setActivePage} />
                <ChromologMethod />
                <Projects />
                <WhoWeHelp />
                <About navigateToSection={navigateToSection} />
                <IndustryExplorer />
                <TechOrbit />
                <AIShowcase />
                <ProductMockup navigateToSection={navigateToSection} />
                <Process />
                <Testimonials />
                <Contact />
                <Recommendations setActivePage={setActivePage} />
              </Suspense>
            </>
          )}

          {activePage === "services" && (
            <Suspense fallback={<SectionSkeleton />}>
              <ServicesIndex setActivePage={setActivePage} />
            </Suspense>
          )}

          {isServiceDetail && (
            <Suspense fallback={<SectionSkeleton />}>
              <ServiceDetail serviceSlug={serviceSlug} setActivePage={setActivePage} navigateToSection={navigateToSection} />
            </Suspense>
          )}

          {activePage === "case-studies" && (
            <Suspense fallback={<SectionSkeleton />}>
              <CaseStudies setActivePage={setActivePage} />
            </Suspense>
          )}

          {activePage === "free-consultation" && (
            <Suspense fallback={<SectionSkeleton />}>
              <FreeConsultation setActivePage={setActivePage} />
            </Suspense>
          )}

          {isLocationPage && (
            <Suspense fallback={<SectionSkeleton />}>
              <LocationPage locationSlug={locationSlug} setActivePage={setActivePage} />
            </Suspense>
          )}

          {isIndustryPage && (
            <Suspense fallback={<SectionSkeleton />}>
              <IndustryPage industrySlug={industrySlug} setActivePage={setActivePage} />
            </Suspense>
          )}

          {activePage === "privacy" && (
            <Suspense fallback={<SectionSkeleton />}>
              <Privacy />
            </Suspense>
          )}
          {activePage === "terms" && (
            <Suspense fallback={<SectionSkeleton />}>
              <Terms />
            </Suspense>
          )}
          {activePage === "blog" && (
            <Suspense fallback={<SectionSkeleton />}>
              <Blog />
            </Suspense>
          )}
          {activePage === "careers" && (
            <Suspense fallback={<SectionSkeleton />}>
              <Careers />
            </Suspense>
          )}
          {activePage === "products" && (
            <Suspense fallback={<SectionSkeleton />}>
              <Products navigateToSection={navigateToSection} setActivePage={setActivePage} />
            </Suspense>
          )}
          {activePage === "500" && (
            <Suspense fallback={<SectionSkeleton />}>
              <ServerError setActivePage={setActivePage} />
            </Suspense>
          )}
          {activePage === "offline" && (
            <Suspense fallback={<SectionSkeleton />}>
              <Offline setActivePage={setActivePage} />
            </Suspense>
          )}
          {activePage === "maintenance" && (
            <Suspense fallback={<SectionSkeleton />}>
              <Maintenance />
            </Suspense>
          )}
          {activePage === "admin" && (
            <Suspense fallback={<SectionSkeleton />}>
              <AdminPortal />
            </Suspense>
          )}

          {!["home", "services", "case-studies", "free-consultation", "privacy", "terms", "blog", "careers", "products", "admin", "500", "offline", "maintenance"].includes(activePage) &&
            !isServiceDetail && !isLocationPage && !isIndustryPage && (
            <Suspense fallback={<SectionSkeleton />}>
              <NotFound setActivePage={setActivePage} />
            </Suspense>
          )}
          </PageTransition>
          </AnimatePresence>
        </main>
      </ErrorBoundary>

      {/* Enterprise Footer (Hidden on Admin Dashboard) */}
      {activePage !== "admin" && (
        <>
          <Footer
            setActivePage={setActivePage}
            navigateToSection={navigateToSection}
          />

          {/* AI Chat Assistant */}
          <AIChat setActivePage={setActivePage} />

          {/* WhatsApp Floating FAB (Desktop only) */}
          <a
            className="whatsapp-fab group hidden md:flex"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackWhatsApp}
            aria-label="Chat with us on WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M16 0C7.164 0 0 7.164 0 16c0 2.82.736 5.46 2.02 7.748L0 32l8.494-2.224A15.93 15.93 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.267 13.267 0 01-6.77-1.854l-.486-.29-5.04 1.32 1.344-4.904-.318-.504A13.267 13.267 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.94c-.398-.2-2.356-1.162-2.72-1.294-.366-.133-.632-.2-.898.2-.266.398-1.03 1.294-1.264 1.56-.232.266-.465.3-.863.1-.398-.2-1.68-.62-3.2-1.977-1.183-1.056-1.98-2.36-2.213-2.758-.232-.398-.024-.613.175-.812.18-.178.398-.465.598-.697.2-.232.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.2-.898-2.164-1.23-2.96-.323-.777-.65-.672-.898-.684l-.764-.013c-.266 0-.697.1-1.063.498-.365.398-1.394 1.362-1.394 3.323s1.427 3.854 1.627 4.12c.2.266 2.81 4.29 6.808 6.016.951.41 1.693.655 2.272.838.954.303 1.823.26 2.51.158.766-.114 2.356-.963 2.688-1.894.332-.93.332-1.727.232-1.894-.1-.166-.366-.266-.764-.465z" />
            </svg>
            <span className="hidden md:inline">Chat with us</span>
          </a>

          {/* Mobile Sticky Action Bar */}
          <MobileStickyBar onOpenAudit={() => setIsAuditModalOpen(true)} />
        </>
      )}

      {/* Cookie Consent Banner */}
      <CookieConsent />

      {/* Digital Efficiency Audit Interactive Tool */}
      <DigitalAuditModal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} />
    </div>
    </AuthProvider>
  );
}
