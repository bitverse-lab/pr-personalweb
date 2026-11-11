import type { Metadata } from "next";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import SavedPages from "@/components/shared/SavedPages";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

// Served by the service worker when a page is requested with no connection and no saved copy.
// Static on purpose: it is cached at install time and must render without the database.
export default function OfflinePage() {
  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
        <section className="page-head">
          <div className="container">
            <p className="path-label mb-3">~/offline</p>
            <h1 className="page-head-title">You are offline</h1>
            <p className="page-head-lede">This page has not been saved on this device yet. Pages you opened before are still readable.</p>
          </div>
        </section>
        <section className="section pt-5">
          <div className="container">
            <div className="reading-col">
              <SavedPages />
            </div>
          </div>
        </section>
      </main>
      <SmallFooter />
    </>
  );
}
