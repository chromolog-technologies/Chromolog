// Chromolog brand assets (portal/public/brand), served under the app's base path.
const BASE = import.meta.env.BASE_URL;

/** The "C" mark — transparent, for dark backgrounds and small sizes. */
export function BrandMark({ className = "h-8 w-8" }) {
  return <img src={`${BASE}brand/chromolog-mark.webp`} alt="Chromolog" className={`${className} object-contain shrink-0`} width="64" height="64" />;
}

/** Full logo with "Chromolog Technologies" wordmark — for light backgrounds. */
export function BrandLogo({ className = "h-28 w-auto" }) {
  return <img src={`${BASE}brand/chromolog-logo.webp`} alt="Chromolog Technologies" className={`${className} object-contain`} width="400" height="382" />;
}
