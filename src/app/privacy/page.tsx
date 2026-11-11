import type { Metadata } from "next";
import Link from "next/link";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import { getProfile } from "@/lib/data/profile";
import { isEmailConfigured } from "@/server/email/send";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this website collects, why, and how to have it removed.",
};

// A plain-language notice that describes what this site really does. It reads the actual configuration
// (email delivery, analytics), so it never claims something that is switched off.
export default async function PrivacyPage() {
  const profile = await getProfile();
  const owner = profile.isPlaceholder ? "the site owner" : profile.fullName;
  const email = profile.email;
  const emailDelivery = isEmailConfigured();
  const analytics = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? "Plausible" : process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? "Umami" : null;

  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
        <section className="page-head">
          <div className="container">
            <p className="path-label mb-3">~/privacy</p>
            <h1 className="page-head-title">Privacy</h1>
            <p className="page-head-lede">This is a personal website run by {owner}. It is deliberately simple, and this page explains in plain language what it stores and why.</p>
          </div>
        </section>
        <section className="section pt-5">
          <div className="container">
            <div className="row">
              <div className="col-lg-8 reading-col">

                <h2 className="privacy-h">What I collect</h2>
                <ul className="text-muted">
                  <li>
                    <strong>Messages you send through the contact form:</strong> your name, email address, the subject and your message. I store them so I can read and reply to you.
                  </li>
                  <li>
                    <strong>A scrambled form of your IP address</strong> when you send a message. It is a one-way, salted hash used only to limit spam (a few messages per hour). The IP address itself is never stored, and the hash cannot be turned back into it.
                  </li>
                  {analytics ? (
                    <li>
                      <strong>Anonymous visit statistics</strong> through {analytics}, which does not use cookies and does not follow you across websites. It counts page views, not people.
                    </li>
                  ) : (
                    <li>
                      <strong>No visit tracking:</strong> this site does not run analytics or advertising trackers.
                    </li>
                  )}
                </ul>

                <h2 className="privacy-h">Cookies</h2>
                <p className="text-muted">Visitors do not receive any cookies. A cookie is only used when the site owner signs in to the private workspace.</p>
                <p className="text-muted">So you can read offline, your browser keeps a copy of the public pages you open, on your device only. Nothing about it is sent to me. Clearing this site&apos;s data in your browser removes it.</p>

                <h2 className="privacy-h">Who can see it</h2>
                <p className="text-muted">
                  Only {owner}. Messages are never sold, shared or used for marketing.
                  {emailDelivery ? " When you send a message, it is also forwarded to my inbox through an email delivery service (Resend), which processes it only to deliver that email." : ""} The site is hosted on infrastructure providers (web hosting and a database), which store the data on my behalf.
                </p>

                <h2 className="privacy-h">How long I keep it</h2>
                <p className="text-muted">Messages are kept until I delete them. I aim to remove ones that are no longer needed.</p>

                <h2 className="privacy-h">Your choices</h2>
                <p className="text-muted">
                  You can ask me to show, correct or delete anything you have sent me.{" "}
                  {email ? (
                    <>
                      Write to <a className="text-decoration-underline" href={`mailto:${email}`}>{email}</a> or use the <Link className="text-decoration-underline" href="/contact">contact form</Link>.
                    </>
                  ) : (
                    <>
                      Use the <Link className="text-decoration-underline" href="/contact">contact form</Link>.
                    </>
                  )}
                </p>

                <h2 className="privacy-h">Links and sharing</h2>
                <p className="text-muted">Share buttons are ordinary links: nothing is loaded from LinkedIn, X or WhatsApp unless you click one, and then their own policies apply.</p>

                <p className="text-muted small mt-5 mb-0">This notice describes how the site works; it is not legal advice.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SmallFooter />
    </>
  );
}
