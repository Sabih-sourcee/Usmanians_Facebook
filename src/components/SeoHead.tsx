import { useEffect, type FC } from "react";
import { useLocation } from "react-router-dom";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  absoluteUrl,
  seoForPath,
} from "../lib/seo";

function upsertMeta(
  selector: string,
  attrs: Record<string, string>,
  content: string
) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(
    `link[rel="${rel}"]`
  ) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/** Keeps title/description/canonical/robots in sync with the active route. */
export const SeoHead: FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = seoForPath(pathname);
    const url = absoluteUrl(seo.path);

    document.title = seo.title;

    upsertMeta('meta[name="description"]', { name: "description" }, seo.description);
    upsertMeta(
      'meta[name="robots"]',
      { name: "robots" },
      seo.noindex ? "noindex, nofollow" : "index, follow"
    );
    upsertLink("canonical", url);

    upsertMeta('meta[property="og:title"]', { property: "og:title" }, seo.title);
    upsertMeta(
      'meta[property="og:description"]',
      { property: "og:description" },
      seo.description
    );
    upsertMeta('meta[property="og:url"]', { property: "og:url" }, url);
    upsertMeta(
      'meta[property="og:type"]',
      { property: "og:type" },
      seo.ogType || "website"
    );
    upsertMeta(
      'meta[property="og:image"]',
      { property: "og:image" },
      DEFAULT_OG_IMAGE
    );
    upsertMeta(
      'meta[property="og:site_name"]',
      { property: "og:site_name" },
      SITE_NAME
    );

    upsertMeta(
      'meta[name="twitter:card"]',
      { name: "twitter:card" },
      "summary_large_image"
    );
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, seo.title);
    upsertMeta(
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      seo.description
    );
    upsertMeta(
      'meta[name="twitter:image"]',
      { name: "twitter:image" },
      DEFAULT_OG_IMAGE
    );
  }, [pathname]);

  return null;
};
