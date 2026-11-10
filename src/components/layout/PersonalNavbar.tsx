"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiDownload } from "react-icons/fi";
import SocialIcon from "@/components/shared/SocialIcon";
import { OPEN_TERMINAL_EVENT } from "@/components/shared/PublicTerminal";
import { useSite } from "@/lib/site-context";

export default function PersonalNavbar() {
  const site = useSite();
  const [scroll, setScroll] = useState(false);
  const [isMenu, setIsMenu] = useState(false);
  // The shortcut is named the way this keyboard says it; decided after mount to keep SSR stable.
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);

  useEffect(() => {
    const onScroll = () => setScroll(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the mobile menu and hands focus back to the button that opened it.
  useEffect(() => {
    if (!isMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setIsMenu(false);
      document.getElementById("isToggle")?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMenu]);

  // Sections with nothing published are left out, so visitors never land on an empty page from the menu.
  const navItems = [
    { label: "Home", href: "/" },
    ...(site.isPlaceholder ? [] : [{ label: "About", href: "/about" }, { label: "CV", href: "/cv" }]),
    ...(site.hasProjects ? [{ label: "Work", href: "/projects" }] : []),
    ...(site.hasArticles ? [{ label: "Writing", href: "/articles" }] : []),
    { label: "Contact", href: "/contact" },
  ];
  const socials = site.links.filter((l) => /^https?:\/\//i.test(l.url)).slice(0, 3);

  return (
    <>
      <a href="#main-content" className="visually-hidden-focusable position-fixed top-0 start-0 m-2 p-2 bg-white text-dark rounded shadow" style={{ zIndex: 2000 }}>
        Skip to main content
      </a>
      <header id="topnav" className={`${scroll ? "nav-sticky" : ""} defaultscroll sticky`}>
        <div className="container">
          <Link className="logo" href="/">
            <span className="logo-light-mode h5 mb-0 fw-bold text-dark">{site.name}</span>
            <span className="logo-dark-mode h5 mb-0 fw-bold text-white">{site.name}</span>
          </Link>
          <div className="menu-extras">
            <div className="menu-item">
              <button
                type="button"
                className={`navbar-toggle border-0 bg-transparent ${isMenu ? "open" : ""}`}
                id="isToggle"
                aria-label={isMenu ? "Close menu" : "Open menu"}
                aria-expanded={isMenu}
                aria-controls="navigation"
                onClick={() => setIsMenu(!isMenu)}
              >
                <div className="lines">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
            </div>
          </div>
          <ul className="buy-button list-inline mb-0">
            {socials.map((l) => (
              <li className="list-inline-item ms-1 d-none d-sm-inline-block" key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-icon btn-pills btn-primary" aria-label={l.label}>
                  <SocialIcon url={l.url} className="icons" />
                </a>
              </li>
            ))}
            <li className="list-inline-item ms-1 d-none d-lg-inline-block">
              <button type="button" className="btn btn-sm btn-pills term-trigger" onClick={() => window.dispatchEvent(new Event(OPEN_TERMINAL_EVENT))} aria-label={`${mac ? "⌘K" : "Ctrl K"}: open the site terminal`} title="Jump anywhere">
                {/* The visible shortcut starts the accessible name, so voice users can say what they see. */}
                {mac ? "⌘K" : "Ctrl K"}
              </button>
            </li>
            {/* Hidden below lg: next to a long name it wrapped onto a second header row and covered page titles; the menu carries it instead. */}
            {!site.isPlaceholder && (
              <li className="list-inline-item ms-1 d-none d-lg-inline-block">
                <a href="/cv/download" className="btn btn-sm btn-pills btn-outline-primary d-inline-flex align-items-center gap-1">
                  <FiDownload aria-hidden /> CV
                </a>
              </li>
            )}
          </ul>

          <nav id="navigation" aria-label="Main" style={{ display: isMenu ? "block" : "none" }}>
            <ul className="navigation-menu nav-right personal-menu" id="navmenu-nav">
              {navItems.map((item) => (
                <li className="has-submenu" key={item.href}>
                  <Link href={item.href} className="sub-menu-item" onClick={() => setIsMenu(false)}>
                    {item.label}
                  </Link>
                </li>
              ))}
              {!site.isPlaceholder && (
                <li className="has-submenu d-lg-none">
                  <a href="/cv/download" className="sub-menu-item" onClick={() => setIsMenu(false)}>
                    Download CV
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
