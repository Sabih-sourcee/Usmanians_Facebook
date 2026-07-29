import React from "react";

interface FeedCardProps {
  children: React.ReactNode;
  className?: string;
}

/** Shared outer surface for every home-feed item (posts + reports). */
export const FeedCard: React.FC<FeedCardProps> = ({ children, className = "" }) => (
  <article
    className={`bg-surface-container-lowest rounded-xl border border-outline-variant/20 flex flex-col relative overflow-hidden ${className}`}
  >
    {children}
  </article>
);

interface FeedCardHeaderProps {
  children: React.ReactNode;
}

export const FeedCardHeader: React.FC<FeedCardHeaderProps> = ({ children }) => (
  <div className="p-md flex items-center gap-md min-w-0">{children}</div>
);

interface FeedCardBodyProps {
  children: React.ReactNode;
}

export const FeedCardBody: React.FC<FeedCardBodyProps> = ({ children }) => (
  <div className="px-md pb-sm">{children}</div>
);

interface FeedCardActionsProps {
  children: React.ReactNode;
}

export const FeedCardActions: React.FC<FeedCardActionsProps> = ({ children }) => (
  <div className="px-sm py-xs border-t border-outline-variant/30 flex items-center justify-between gap-xs">
    {children}
  </div>
);

export const feedActionBtnClass =
  "min-h-[44px] min-w-[44px] px-sm flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-lg cursor-pointer";
