/** Site-wide SEO constants (claude-seo technical + schema foundation). */

export const SITE_URL = "https://usmanians-facebook.vercel.app";
export const SITE_NAME = "Usmanian";
export const SITE_TAGLINE =
  "Private network for Usman Public School System students & alumni";

export const DEFAULT_DESCRIPTION =
  "Usmanian is the CID-gated private social network for Usman Public School System (UPSS) students and alumni. Privacy by default, friend consent, and campus-only access.";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og/og-default.png`;

export type SeoConfig = {
  title: string;
  description: string;
  path: string;
  /** When true, emit noindex,nofollow (private / auth app surfaces). */
  noindex?: boolean;
  ogType?: "website" | "profile";
};

export const SEO_ROUTES: Record<string, SeoConfig> = {
  "/": {
    title: "Usmanian — Private Social Network for UPSS Students & Alumni",
    description: DEFAULT_DESCRIPTION,
    path: "/",
  },
  "/login": {
    title: "Log in to Usmanian | UPSS Private Network",
    description:
      "Sign in to Usmanian with your approved Usman Public School System account. CID-verified students and alumni only.",
    path: "/login",
  },
  "/signup": {
    title: "Join Usmanian | Sign up with your UPSS CID",
    description:
      "Create a Usmanian account with your student CID, class, and campus. Accounts stay pending until admin approval — verified Usmanians only.",
    path: "/signup",
  },
  "/pending-approval": {
    title: "Pending approval | Usmanian",
    description: "Your Usmanian account is waiting for admin verification.",
    path: "/pending-approval",
    noindex: true,
  },
  "/feed": {
    title: "Home feed | Usmanian",
    description: SITE_TAGLINE,
    path: "/feed",
    noindex: true,
  },
  "/friends": {
    title: "Friends | Usmanian",
    description: SITE_TAGLINE,
    path: "/friends",
    noindex: true,
  },
  "/activity": {
    title: "Activity | Usmanian",
    description: SITE_TAGLINE,
    path: "/activity",
    noindex: true,
  },
  "/profile": {
    title: "Profile | Usmanian",
    description: SITE_TAGLINE,
    path: "/profile",
    noindex: true,
  },
  "/admin": {
    title: "Admin approvals | Usmanian",
    description: SITE_TAGLINE,
    path: "/admin",
    noindex: true,
  },
};

export function seoForPath(pathname: string): SeoConfig {
  if (SEO_ROUTES[pathname]) return SEO_ROUTES[pathname];
  const base = "/" + pathname.split("/").filter(Boolean)[0];
  if (SEO_ROUTES[base]) return SEO_ROUTES[base];
  return {
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    path: pathname,
    noindex: true,
  };
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
