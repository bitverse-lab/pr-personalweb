import type { Metadata } from "next";
import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ContactSection from "@/components/shared/ContactSection";
import { dict } from "@/lib/i18n/dict";
import { languages, localize, type Locale } from "@/lib/i18n/locale";

export function contactMetadata(locale: Locale): Metadata {
  const t = dict(locale).meta;
  return { title: t.contactTitle, description: t.contactDescription, alternates: { canonical: localize(locale, "/contact"), languages: languages("/contact") } };
}

export function ContactPage() {
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
