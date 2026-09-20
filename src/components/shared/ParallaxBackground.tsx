"use client";

import { Parallax } from "react-parallax";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// Decorative page-header background. With "reduce motion" on, it is a still image instead of a parallax effect.
export default function ParallaxBackground({ image, alt }: { image: string; alt: string }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) {
    return <div role="presentation" style={{ position: "absolute", inset: 0, backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }} />;
  }
  return <Parallax blur={{ min: 0, max: 0 }} bgImage={image} bgImageAlt={alt} strength={500} style={{ position: "absolute", width: "100%", height: "100%" }} />;
}
