"use client";

import { useEffect, useState, type ReactNode } from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";

export default function ResponsiveProjectGrid({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="projects-grid-fallback">{children}</div>;
  }

  return (
    <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 5 }}>
      <Masonry>{children}</Masonry>
    </ResponsiveMasonry>
  );
}
