// ─── Footer — Clean Kerala Footprint & Global SEO Schema ───────────────────

import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Award, Shield } from "lucide-react";
import Button from "./ui/Button";
import BrandLogo from "./BrandLogo";
import { easings } from "../motion/easings";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const columnVariant = (delay = 0) => ({
  initial: prefersReducedMotion ? {} : { opacity: 0, y: 24, filter: "blur(5px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-5% 0px" },
  transition: { duration: 0.65, delay, ease: easings.expo },
});

export default function Footer({ setActivePage }) {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e, targetPath) => {
    e.preventDefault();
    if (setActivePage) {
      setActivePage(targetPath);
      window.history.pushState({}, "", `/${targetPath}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const socialLinks = [
    {
      href: "https://www.linkedin.com/company/chromolog-technologies/",
      label: "LinkedIn",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
    {
      href: "https://www.instagram.com/chromologtechnologies/",
      label: "Instagram",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      href: "https://www.facebook.com/profile.php?id=61560645833859",
      label: "Facebook",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="relative bg-bg-dark border-t border-white/[0.08] overflow-hidden pt-16 pb-10">
      {/* Ambient background lights */}
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-secondary/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12">

          {/* Col 1: Brand & Positioning */}
          <motion.div {...columnVariant(0)} className="lg:col-span-4 space-y-4">
            <a
              className="inline-block group"
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActivePage("home");
                window.history.pushState({}, "", "/");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-label="Chromolog Home"
            >
              <BrandLogo compact className="h-16 w-auto max-w-[240px]" />
            </a>
            <p className="text-muted-text text-xs leading-relaxed max-w-sm">
              We Build Digital Systems for Growing Businesses. From website upgrades to custom web applications, CRM, HRMS, LMS and business software, Chromolog helps businesses replace manual processes and outdated technology.
            </p>

            {/* Social Links */}
            <div className="flex space-x-2.5 pt-1">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-muted-text hover:text-white transition-colors duration-300"
                  whileHover={prefersReducedMotion ? {} : { scale: 1.08, color: "#00e5ff" }}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1 text-muted-text/60">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider font-heading">
                <Award className="w-3.5 h-3.5 text-accent" />
                <span>Custom Engineering</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider font-heading">
                <Shield className="w-3.5 h-3.5 text-success" />
                <span>100% IP Ownership</span>
              </div>
            </div>
          </motion.div>

          {/* Col 2: Priority Digital Systems (Services) */}
          <motion.div {...columnVariant(0.1)} className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-heading font-bold text-white uppercase tracking-wider">Digital Systems</h4>
            <nav className="flex flex-col space-y-1.5 text-xs" aria-label="Services Navigation">
              {[
                { label: "Custom Software", path: "services/custom-software-development" },
                { label: "Web Applications", path: "services/web-application-development" },
                { label: "Website Development", path: "services/website-development" },
                { label: "Website Redesign", path: "services/website-redesign" },
                { label: "Mobile App Development", path: "services/mobile-app-development" },
                { label: "Custom CRM Systems", path: "services/crm-development" },
                { label: "Custom ERP Platforms", path: "services/erp-development" },
                { label: "HRMS & Payroll", path: "services/hrms-development" },
                { label: "LMS Student Portals", path: "services/lms-development" },
                { label: "Business Automation", path: "services/business-automation" },
              ].map((link, i) => (
                <a
                  key={i}
                  href={`/${link.path}`}
                  onClick={(e) => handleLinkClick(e, link.path)}
                  className="text-muted-text hover:text-accent transition-colors duration-200 line-clamp-1"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </motion.div>

          {/* Col 3: Company & Regional Coverage (Kerala Focus Visible) */}
          <motion.div {...columnVariant(0.18)} className="lg:col-span-2 space-y-4">
            <div>
              <h4 className="text-xs font-heading font-bold text-white uppercase tracking-wider mb-2">Company</h4>
              <nav className="flex flex-col space-y-1.5 text-xs text-muted-text">
                {[
                  { label: "Case Studies & Proof", path: "case-studies" },
                  { label: "Free Consultation", path: "free-consultation" },
                  { label: "Knowledge Hub", path: "blog" },
                  { label: "Careers", path: "careers" },
                ].map((item, i) => (
                  <a key={i} href={`/${item.path}`} onClick={(e) => handleLinkClick(e, item.path)} className="hover:text-white transition-colors">
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div>
              <h4 className="text-xs font-heading font-bold text-white uppercase tracking-wider mb-2">Regional Coverage</h4>
              <nav className="flex flex-col space-y-1.5 text-xs text-muted-text">
                {[
                  { label: "Kochi, Kerala", path: "locations/kochi" },
                  { label: "Kerala State", path: "locations/kerala" },
                ].map((loc, i) => (
                  <a key={i} href={`/${loc.path}`} onClick={(e) => handleLinkClick(e, loc.path)} className="hover:text-white transition-colors">
                    {loc.label}
                  </a>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Col 4: Office Contact Details */}
          <motion.div {...columnVariant(0.26)} className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-heading font-bold text-white uppercase tracking-wider">Office Details</h4>
            
            <div className="space-y-3 text-xs text-muted-text">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white text-[11px] font-heading">Kerala Office:</strong>
                  <p className="leading-relaxed">SPATIUM, Ground Floor Island Castle, Opposite YMCA, Chittoor Road, Ernakulam, Kerala 682035.</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:info@chromologtechnologies.com" className="hover:text-white transition-colors text-xs">
                  info@chromologtechnologies.com
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-success shrink-0" />
                <a href="tel:+919400230723" className="hover:text-white transition-colors text-xs">
                  +91 94002 30723 / +91 84978 85369
                </a>
              </div>
            </div>

            <div className="pt-1">
              <Button
                variant="gradient"
                size="sm"
                className="w-full justify-center text-xs py-2"
                onClick={(e) => handleLinkClick(e, "free-consultation")}
              >
                Get a Free Technology Consultation
              </Button>
            </div>
          </motion.div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-text font-heading">
          <p>&copy; {currentYear} Chromolog Technologies. All rights reserved. Custom Software & Digital Systems Company.</p>
          <div className="flex space-x-4">
            <a href="/privacy" onClick={(e) => handleLinkClick(e, "privacy")} className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" onClick={(e) => handleLinkClick(e, "terms")} className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
