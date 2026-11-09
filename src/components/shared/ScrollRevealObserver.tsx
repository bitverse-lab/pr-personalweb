"use client";

import { useEffect } from "react";

export default function ScrollRevealObserver() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"));
    if (elements.length === 0) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -48px 0px", threshold: 0.08 },
    );

    elements.forEach((element) => {
      const bounds = element.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) {
        element.classList.add("is-visible");
      } else {
        observer.observe(element);
      }
    });

    document.documentElement.classList.add("has-scroll-reveal");

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("has-scroll-reveal");
    };
  }, []);

  return null;
}
