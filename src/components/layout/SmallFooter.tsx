"use client";

import Link from "next/link";
import { FiMail, FiRss } from "react-icons/fi";
import SocialIcon from "@/components/shared/SocialIcon";
import { useSite } from "@/lib/site-context";
import { useDict, useLocalize } from "@/lib/i18n/context";

export default function SmallFooter() {
  const site = useSite();
  const t = useDict().footer;
  const loc = useLocalize();
  const links = site.links.filter((l) => /^(https?:\/\/|mailto:)/i.test(l.url));

  return (
    <footer className="bg-footer footer-bar">
      <div className="footer-py-30">
        <div className="container text-center">
          <div className="row align-items-center">
            <div className="col-sm-3">
              <div className="text-sm-start">
                <Link href={loc("/")} className="logo-footer h5 mb-0 fw-bold text-white text-decoration-none">
                  {site.name}
                </Link>
              </div>
            </div>

            <div className="col-sm-5 mt-4 mt-sm-0 pt-2 pt-sm-0">
              <div className="text-center">
                <p className="mb-0">
                  © {new Date().getFullYear()} {site.name}. {t.rights} ·{" "}
                  <Link href="/proof" className="text-foot text-decoration-underline">{t.proof}</Link> ·{" "}
                  <Link href="/privacy" className="text-foot text-decoration-underline">{t.privacy}</Link>
                </p>
              </div>
            </div>

            <div className="col-sm-4 mt-4 mt-sm-0 pt-2 pt-sm-0">
              <ul className="list-unstyled social-icon foot-social-icon text-sm-start mb-0">
                {links.map((l) => (
                  <li className="list-inline-item ms-1" key={l.url}>
                    <a href={l.url} target={l.url.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="rounded" aria-label={l.label}>
                      <SocialIcon url={l.url} />
                    </a>
                  </li>
                ))}
                {site.email && !links.some((l) => l.url === `mailto:${site.email}`) && (
                  <li className="list-inline-item ms-1">
                    <a href={`mailto:${site.email}`} className="rounded" aria-label={t.email}>
                      <FiMail aria-hidden />
                    </a>
                  </li>
                )}
                {site.hasArticles && (
                  <li className="list-inline-item ms-1">
                    <a href="/feed.xml" className="rounded" aria-label={t.rss}>
                      <FiRss aria-hidden />
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
