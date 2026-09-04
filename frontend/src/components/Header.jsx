// ─── Header — Premium Navigation ─────────────────────────────────────────────
// Desktop: Shared-layout sliding nav indicator + magnetic CTA buttons
// Mobile: Clip-path drawer with stagger menu items + reverse-stagger close
// Scroll: Transparent → dark glass blur

import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./ui/Button";
import BrandLogo from "./BrandLogo";
import { easings } from "../motion/easings";

const pageItems = new Set(["blog", "careers", "products", "services", "case-studies", "free-consultation", "contact"]);

export default function Header({ activePage = "home", setActivePage, navigateToSection }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (activePage !== "home") return undefined;

    const sectionIds = ["home", "about", "projects", "services", "ai", "product", "process", "contact"];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0, rootMargin: "-40% 0px -55% 0px" }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activePage]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleLinkClick = (e, sectionId) => {
    e.preventDefault();
    setIsDrawerOpen(false);
    if (pageItems.has(sectionId) || sectionId.startsWith("services/")) {
      setActivePage(sectionId);
      window.history.pushState({}, "", `/${sectionId}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setActiveSection(sectionId);
      window.history.pushState({}, "", "/");
      navigateToSection(sectionId);
    }
  };

  const handleBrandClick = (e) => {
    e.preventDefault();
    setIsDrawerOpen(false);
    setActivePage("home");
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new CustomEvent("chromolog:scrollTo", { detail: { id: "home" } }));
  };

  const menuItems = [
    { label: "Home", id: "home" },
    { label: "About Us", id: "about" },
    { label: "Services", id: "services", hasDropdown: true },
    { label: "Technologies", id: "technologies" },
    { label: "Blog", id: "blog" },
  ];

  const isActive = (item) => {
    if (pageItems.has(item.id)) return activePage === item.id || activePage.startsWith(`${item.id}/`);
    return activePage === "home" && activeSection === item.id;
  };

  // ── Mobile drawer variants ────────────────────────────────────────────────
  const drawerVariants = {
    hidden: {
      clipPath: "inset(0 0 100% 0)",
      opacity: 0,
      scale: 0.97,
      filter: "blur(8px)",
    },
    visible: {
      clipPath: "inset(0 0 0% 0)",
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.45,
        ease: easings.expo,
      },
    },
    exit: {
      clipPath: "inset(0 0 100% 0)",
      opacity: 0,
      scale: 0.97,
      filter: "blur(6px)",
      transition: {
        duration: 0.35,
        ease: easings.snappy,
      },
    },
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.35,
        delay: i * 0.045,
        ease: easings.smooth,
      },
    }),
    exit: (i) => ({
      opacity: 0,
      x: -16,
      transition: {
        duration: 0.2,
        delay: (menuItems.length - 1 - i) * 0.03,
        ease: easings.snappy,
      },
    }),
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 border-b ${
        isScrolled
          ? "bg-[#060818]/85 backdrop-blur-xl border-white/10 py-3 shadow-2xl shadow-indigo-950/40"
          : "bg-transparent border-white/5 py-4 lg:py-5"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 lg:gap-8">

          {/* Brand Logo */}
          <motion.a
            className="flex items-center group relative overflow-hidden select-none min-w-0"
            href="#home"
            onClick={handleBrandClick}
            aria-label="Chromolog Home"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.25, ease: easings.snappy }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
            <BrandLogo className="h-10 sm:h-12 w-auto max-w-[260px]" />
          </motion.a>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center justify-center gap-6 lg:gap-8 relative" aria-label="Site sections">
            {menuItems.map((item) => (
              <a
                key={item.id}
                href={pageItems.has(item.id) ? `/${item.id}` : `#${item.id}`}
                onClick={(e) => handleLinkClick(e, item.id)}
                aria-current={isActive(item) ? "page" : undefined}
                className={`relative flex items-center gap-1 py-2 text-sm font-heading font-medium transition-colors duration-300 group ${
                  isActive(item) ? "text-white font-semibold" : "text-slate-300 hover:text-white"
                }`}
              >
                <span className="relative z-10">{item.label}</span>
                {item.hasDropdown && (
                  <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}

                {/* Active indicator bar */}
                {isActive(item) && (
                  <motion.span
                    layoutId="nav-active-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #38bdf8, #a855f7)",
                      boxShadow: "0 0 12px rgba(168, 85, 247, 0.6)",
                    }}
                    transition={{ duration: 0.35, ease: easings.smooth }}
                  />
                )}
              </a>
            ))}
          </nav>

          {/* Desktop CTA Button */}
          <div className="hidden lg:flex items-center justify-end">
            <motion.a
              href="#contact"
              onClick={(e) => handleLinkClick(e, "contact")}
              whileHover={{ scale: 1.04, boxShadow: "0 0 25px rgba(124, 58, 237, 0.5)" }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-2.5 rounded-full text-sm font-heading font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-purple-500/25"
            >
              Contact Us
            </motion.a>
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex xl:hidden items-center justify-end gap-3">
            <motion.div
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="gradient"
                size="sm"
                onClick={(e) => handleLinkClick(e, "free-consultation")}
              >
                Consultation
              </Button>
            </motion.div>

            <motion.button
              className="p-2 border border-white/10 hover:border-white/20 rounded-xl bg-white/[0.02] text-white hover:bg-white/[0.08] transition-all relative overflow-hidden"
              aria-label="Toggle menu"
              aria-expanded={isDrawerOpen}
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              whileTap={{ scale: 0.92 }}
              transition={{ duration: 0.15 }}
            >
              <AnimatePresence mode="wait">
                {isDrawerOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

        </div>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 top-[65px] bg-black/60 backdrop-blur-md z-30 xl:hidden"
            />

            {/* Clip-path slide-down menu */}
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-full left-0 right-0 bg-bg-dark/97 border-b border-white/[0.08] z-30 xl:hidden overflow-hidden shadow-2xl backdrop-blur-xl"
              style={{ transformOrigin: "top center" }}
            >
              <div className="px-6 py-6 max-h-[80vh] overflow-y-auto">
                <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
                  {menuItems.map((item, i) => (
                    <motion.a
                      key={item.id}
                      href={pageItems.has(item.id) ? `/${item.id}` : `#${item.id}`}
                      onClick={(e) => handleLinkClick(e, item.id)}
                      aria-current={isActive(item) ? "page" : undefined}
                      custom={i}
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={`flex items-center justify-between text-base font-heading font-semibold py-3 px-3 rounded-xl border transition-all ${
                        isActive(item)
                          ? "text-white border-primary/20 bg-primary/5"
                          : "text-muted-text border-transparent hover:text-white hover:bg-white/[0.03] hover:border-white/[0.06]"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ArrowRight
                        className={`w-4 h-4 transition-colors ${
                          isActive(item) ? "text-accent" : "text-muted-text/40"
                        }`}
                      />
                    </motion.a>
                  ))}
                </nav>

                {/* Mobile CTA buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: menuItems.length * 0.045 + 0.05 }}
                  className="flex flex-col space-y-3 pt-5 mt-4 border-t border-white/[0.06]"
                >
                  <a
                    href="#projects"
                    onClick={(e) => handleLinkClick(e, "projects")}
                    className="w-full text-center py-3 text-base font-heading font-semibold border border-white/10 hover:border-white/20 rounded-xl hover:bg-white/[0.04] transition-all text-white"
                  >
                    View Work
                  </a>
                  <Button
                    variant="gradient"
                    size="md"
                    className="w-full"
                    onClick={(e) => handleLinkClick(e, "contact")}
                  >
                    Start a Project
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
