import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchActiveBanner } from "../lib/api/banners";
import type { BannerView } from "../types/models";

const DISMISS_KEY = "usmanian_banner_dismissed";

export const AnnouncementBanner: React.FC = () => {
  const [banner, setBanner] = useState<BannerView | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    void fetchActiveBanner().then(({ data }) => {
      if (!data) return;
      const key = `${DISMISS_KEY}_${data.id}`;
      if (sessionStorage.getItem(key) === "1") {
        setDismissed(true);
        return;
      }
      setBanner(data);
    });
  }, []);

  if (!banner || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(`${DISMISS_KEY}_${banner.id}`, "1");
    setDismissed(true);
  };

  return (
    <div className="px-margin-mobile -mt-sm mb-sm">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-sm bg-secondary-fixed text-on-secondary-fixed rounded-full px-md py-sm shadow-sm border border-secondary-fixed-dim/40">
          <p className="text-label-md font-semibold text-center flex-1">{banner.text}</p>
          {banner.linkUrl && (
            <Link
              to={banner.linkUrl}
              className="shrink-0 min-h-[36px] px-sm rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-semibold inline-flex items-center"
            >
              {banner.linkText || "Learn more"}
            </Link>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss announcement"
            className="shrink-0 w-8 h-8 rounded-full text-on-secondary-fixed hover:bg-secondary-fixed-dim/40 cursor-pointer"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};
