import type { Metadata, Viewport } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/legacy/scss/style.scss";
import "@/styles/legacy/css/materialdesignicons.min.css";
import ScrollTop from "@/components/layout/ScrollTop";
import NavigationProgress from "@/components/layout/NavigationProgress";
import Analytics from "@/components/shared/Analytics";
import { getProfile } from "@/lib/data/profile";
import { getSiteInfo } from "@/lib/data/site";
import { siteUrl } from "@/lib/site";
import { SiteProvider } from "@/lib/site-context";
import ViewTransitionLinks from "@/components/shared/ViewTransitionLinks";
import PublicTerminal from "@/components/shared/PublicTerminal";
import { getTerminalIndex } from "@/lib/data/terminal";
import ServiceWorker from "@/components/shared/ServiceWorker";

export const viewport: Viewport = { themeColor: "#2a52c3" };

// The site name comes from the profile, so pages refresh at most every 5 minutes (and instantly when the profile is saved).
export const revalidate = 300;

// Static 1200×630 preview used whenever a page has no image of its own.
const DEFAULT_OG = { url: "/og-default.png", width: 1200, height: 630, alt: "Site preview" };

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const name = profile.isPlaceholder ? "Personal OS" : profile.fullName;
  const description = profile.isPlaceholder ? "Personal website and workspace" : profile.headline || profile.summary.slice(0, 160) || `${name} — portfolio, CV and articles`;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: name, template: `%s | ${name}` },
    description,
    applicationName: name,
    alternates: { canonical: "./", types: { "application/rss+xml": [{ url: "/feed.xml", title: `${name} — Articles` }] } },
    authors: [{ name }],
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
    openGraph: { type: "website", siteName: name, title: name, description, images: [DEFAULT_OG] },
    twitter: { card: "summary_large_image", title: name, description, images: [DEFAULT_OG.url] },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [site, terminal] = await Promise.all([getSiteInfo(), getTerminalIndex()]);

  return (
    <html lang="en">
      <body>
        <NavigationProgress />
        <ViewTransitionLinks />
        <SiteProvider value={site}>
          {children}
          <PublicTerminal index={terminal} />
          <ScrollTop />
          <Analytics />
          <ServiceWorker />
        </SiteProvider>
      </body>
    </html>
  );
}
