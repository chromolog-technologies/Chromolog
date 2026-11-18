import { CalendarCheck } from "lucide-react";
import { trackBookingClick } from "../utils/analytics";

// Free-consultation booking page (e.g. Cal.com), set as the GitHub variable VITE_BOOKING_URL.
export const BOOKING_URL = import.meta.env.VITE_BOOKING_URL || "";

/** "Book a 30-minute call" button shown after a form is sent. Renders nothing until a booking link is set. */
export default function BookingLink({ source, className = "" }) {
  if (!BOOKING_URL) return null;
  return (
    <a
      href={BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackBookingClick(source)}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold font-heading hover:bg-blue-600 transition-colors shadow-md ${className}`}
    >
      <CalendarCheck className="w-4 h-4" /> Book a 30-minute call now
    </a>
  );
}
