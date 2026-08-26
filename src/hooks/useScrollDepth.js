import { useEffect, useRef } from "react";
import { trackScrollDepth } from "../utils/analytics";

/**
 * Tracks scroll depth milestones (25%, 50%, 75%, 100%).
 * Fires analytics events once per milestone per page route.
 * Pass `activePage` so milestones reset on SPA navigation.
 */
export default function useScrollDepth(activePage) {
  const fired = useRef(new Set());

  // Reset milestones whenever the user navigates to a new page
  useEffect(() => {
    fired.current.clear();
  }, [activePage]);

  useEffect(() => {
    const milestones = [25, 50, 75, 100];

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const percent = Math.round((scrollTop / docHeight) * 100);

      for (const m of milestones) {
        if (percent >= m && !fired.current.has(m)) {
          fired.current.add(m);
          trackScrollDepth(m);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
}
