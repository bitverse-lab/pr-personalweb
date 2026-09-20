"use client";

import { useEffect, useState } from "react";
import { AiOutlineArrowUp } from "react-icons/ai";

export default function ScrollTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY >= 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button type="button" onClick={scrollToTop} id="back-to-top" aria-label="Back to top" className="back-to-top rounded-pill fs-5 border-0" style={{ display: visible ? "inline" : "none" }}>
      <AiOutlineArrowUp className="fea icon-sm icons align-middle" />
    </button>
  );
}
