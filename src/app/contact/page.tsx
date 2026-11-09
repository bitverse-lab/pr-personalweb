import type { Metadata } from "next";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ContactSection from "@/components/shared/ContactSection";

export const metadata: Metadata = {
  title: "Contact",
  description: "Hiring, a project, or a question about a post? Get in touch.",
};

export default function ContactPage() {
  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1} className="contact-page">
        <ContactSection level={1} />
      </main>
      <SmallFooter />
    </>
  );
}
