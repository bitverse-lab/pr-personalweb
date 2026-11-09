"use client";

import { useEffect, useState } from "react";
import { AiOutlineArrowUp } from "react-icons/ai";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export default function ScrollTop() {
  const [visible, setVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY >= 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <button type="button" onClick={scrollToTop} id="back-to-top" aria-label="Back to top" className={`back-to-top rounded-pill fs-5 border-0${visible ? " is-visible" : ""}`} aria-hidden={!visible} tabIndex={visible ? 0 : -1}>
      <AiOutlineArrowUp className="fea icon-sm icons align-middle" />
    </button>
  );
}
