import { useEffect, useRef } from "react";
import { trackEvent } from "../utils/analytics";

/**
 * Tracks time spent on page, firing analytics events at key milestones.
 * Milestones: 30s, 60s, 120s, 300s (5 min).
 */
export default function useTimeOnPage() {
  const fired = useRef(new Set());

  useEffect(() => {
    const milestones = [30, 60, 120, 300];
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      for (const m of milestones) {
        if (elapsed >= m && !fired.current.has(m)) {
          fired.current.add(m);
          trackEvent("Engagement", "time_on_page", `${m}s`, m);
        }
      }

      // Stop checking after all milestones fired
      if (fired.current.size >= milestones.length) {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);
}
