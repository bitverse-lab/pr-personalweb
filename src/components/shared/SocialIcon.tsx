import type { IconType } from "react-icons";
import { FiDribbble, FiFacebook, FiGithub, FiGlobe, FiInstagram, FiLink, FiLinkedin, FiMail, FiTwitter, FiYoutube } from "react-icons/fi";
import { AiOutlineBehance } from "react-icons/ai";

const HOSTS: [RegExp, IconType][] = [
  [/(^|\.)github\.com$/, FiGithub],
  [/(^|\.)linkedin\.com$/, FiLinkedin],
  [/(^|\.)(twitter|x)\.com$/, FiTwitter],
  [/(^|\.)instagram\.com$/, FiInstagram],
  [/(^|\.)facebook\.com$/, FiFacebook],
  [/(^|\.)youtube\.com$|^youtu\.be$/, FiYoutube],
  [/(^|\.)dribbble\.com$/, FiDribbble],
  [/(^|\.)behance\.net$/, AiOutlineBehance],
];

/** Picks an icon from the link's host; anything unknown gets a generic link icon. */
export function iconForUrl(url: string): IconType {
  if (/^mailto:/i.test(url)) return FiMail;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return HOSTS.find(([re]) => re.test(host))?.[1] ?? FiGlobe;
  } catch {
    return FiLink;
  }
}

export default function SocialIcon({ url, className }: { url: string; className?: string }) {
  const Icon = iconForUrl(url);
  return <Icon className={className} aria-hidden />;
}
