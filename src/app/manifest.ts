import type { MetadataRoute } from "next";
import { getProfile } from "@/lib/data/profile";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const profile = await getProfile();
  const name = profile.isPlaceholder ? "Personal OS" : profile.fullName;
  return {
    name,
    short_name: name.split(" ")[0],
    description: profile.isPlaceholder ? "Personal website" : profile.headline || `${name} — portfolio, CV and articles`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2a52c3",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
