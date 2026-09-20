import type { Metadata } from "next";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ContactSection from "@/components/shared/ContactSection";
import ParallaxBackground from "@/components/shared/ParallaxBackground";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch.",
};

export default function ContactPage() {
  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
        <section className="position-relative overflow-hidden">
          <ParallaxBackground image="/images/bg/03.jpg" alt="" />
          <div className="bg-overlay bg-gradient-overlay-2"></div>
          <div className="bg-half-170 d-table w-100">
            <div className="container">
              <div className="row mt-5 justify-content-center">
                <div className="col-12">
                  <div className="title-heading text-center">
                    <h1 className="h5 heading fw-semibold mb-0 sub-heading text-white title-dark">Contact</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <ContactSection heading="Send me a message" />
      </main>
      <SmallFooter />
    </>
  );
}
