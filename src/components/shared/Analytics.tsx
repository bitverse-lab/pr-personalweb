"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// Optional, cookie-free visitor statistics (Plausible or Umami). Nothing loads unless one is configured,
// never in development, and never inside your private workspace or the sign-in page.
export default function Analytics() {
  const pathname = usePathname() ?? "";
  if (process.env.NODE_ENV !== "production") return null;
  if (pathname.startsWith("/me") || pathname.startsWith("/login")) return null;

  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  if (plausibleDomain) {
    return <Script defer strategy="afterInteractive" data-domain={plausibleDomain} src={process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js"} />;
  }
  if (umamiId) {
    return <Script defer strategy="afterInteractive" data-website-id={umamiId} data-do-not-track="true" src={process.env.NEXT_PUBLIC_UMAMI_SRC || "https://cloud.umami.is/script.js"} />;
  }
  return null;
}
