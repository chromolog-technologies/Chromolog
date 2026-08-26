import { useEffect, useRef } from "react";
import { trackSectionView as trackAnalyticsSectionView } from "../utils/analytics";
import {
  trackSectionView as trackVisitorSectionView,
  trackVisitorPageView,
  updateSectionTime,
} from "../utils/visitor";

const OBSERVED_SECTIONS = [
  "home",
  "about",
  "industries",
  "projects",
  "services",
  "ai",
  "product",
  "process",
  "testimonials",
  "contact",
];

export default function useVisitorIntelligence(activePage) {
  const activeSection = useRef(null);
  const enteredAt = useRef(Date.now());

  useEffect(() => {
    const pagePath = activePage === "home" ? "/" : `/${activePage}`;
    trackVisitorPageView(pagePath);
  }, [activePage]);

  useEffect(() => {
    if (activePage !== "home") return undefined;

    const commitTime = () => {
      if (!activeSection.current) return;
      const seconds = Math.max(1, Math.round((Date.now() - enteredAt.current) / 1000));
      updateSectionTime(activeSection.current, seconds);
      enteredAt.current = Date.now();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const sectionId = entry.target.id;
          if (sectionId === activeSection.current) return;

          commitTime();
          activeSection.current = sectionId;
          enteredAt.current = Date.now();
          trackVisitorSectionView(sectionId);
          trackAnalyticsSectionView(sectionId);
        });
      },
      // Trigger-band: fires when section top crosses the middle-ish of the viewport.
      // Matches the Header's IntersectionObserver so analytics align with nav highlight.
      { threshold: 0, rootMargin: "-40% 0px -55% 0px" }
    );

    OBSERVED_SECTIONS.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    document.addEventListener("visibilitychange", commitTime);
    window.addEventListener("beforeunload", commitTime);

    return () => {
      commitTime();
      observer.disconnect();
      document.removeEventListener("visibilitychange", commitTime);
      window.removeEventListener("beforeunload", commitTime);
    };
  }, [activePage]);
}
