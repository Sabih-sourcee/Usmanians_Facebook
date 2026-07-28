import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ pageTitle = "Home" }) => {
  const { user } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  };

  const avatarUrl =
    user?.avatar ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCXAbbFpzRozdzNhnp6Q-4R4sd5YFb4o7Bue4GX_LkascExPoRIx61jvX4l3sWQARY77kjmrwJ302CXZdkHJXqiKLOugjBlDPlc7dSMb1gbmzt9_orhpK4JgGk7wMlVezZYSmculsq6QbMqRFhziOSJLsU3UZzdH5JD0a7iPPxfmgDsJ9znfu0s9QdEfIGlA9i94PnmnPsNZlynKmKNNtxkGjVMpa6Uh5S7S3vJPmoHD7BrzGDlTuk";

  const showPageLabel = pageTitle !== "Home";

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/25 pt-safe">
      <div className="max-w-2xl mx-auto">
        <div className="h-14 px-margin-mobile flex items-center justify-between gap-sm">
          <Link to="/" className="flex items-center gap-sm min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg">
            <span className="shrink-0 p-0.5 bg-surface-container-lowest rounded-full border border-outline-variant">
              <img
                alt=""
                className="h-8 w-8 object-contain"
                width={32}
                height={32}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1W6yJigLQBjyOCGJpWvJMCdNX4HFXea2TwN5MMNsSxJvEWOsniV4a9VMmL2JOoyVaNV5_xUoRM2cacU5RCqwfzDe_mO4dzVpFGUCVWfzvGch-bRnX_wQDysKT5-D4Makm8R_6mYVEtNQNCub_udd3qRdVFGUBXVvWzjWfZxDqhB4jFkX4_IZoioUCw-kPEfQD1H8jsvYedC9lTQFJphQKHS6tzcsE2D7rKVDcEVdpoYCGuHnEUKE"
              />
            </span>
            <div className="min-w-0 flex flex-col">
              <span className="font-headline-md text-[20px] leading-none text-primary tracking-tight truncate font-semibold">
                Usmanian
              </span>
              {showPageLabel && (
                <span className="text-label-sm text-on-surface-variant leading-tight truncate mt-0.5">
                  {pageTitle}
                </span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              aria-label="Search students, courses, or notes"
              onClick={() => showToast("Search opens here — filter by student, course, or note tag")}
              className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-full cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Notifications, 2 unread"
              onClick={() => showToast("2 new announcements from Campus 12")}
              className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-full relative cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full" aria-hidden="true" />
            </button>
            <Link
              to="/profile"
              aria-label="View your profile"
              className="ml-1 w-11 h-11 flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <img
                alt=""
                className="w-9 h-9 rounded-full object-cover ring-2 ring-outline-variant/40"
                src={avatarUrl}
              />
            </Link>
          </div>
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        {toast}
      </div>
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-50 max-w-[min(92vw,24rem)] px-md py-sm rounded-xl bg-inverse-surface text-inverse-on-surface text-body-sm shadow-lg fade-toast pointer-events-none text-center">
          {toast}
        </div>
      )}
    </header>
  );
};
