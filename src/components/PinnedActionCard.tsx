import React from "react";

export interface PinnedActionCardProps {
  title: string;
  iconType: "vote" | "report" | string;
  onClick?: () => void;
}

export const PinnedActionCard: React.FC<PinnedActionCardProps> = ({
  title,
  iconType,
  onClick,
}) => {
  const isReport = iconType === "report";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-surface-container-lowest rounded-xl p-md border border-outline-variant text-left relative overflow-hidden active:scale-[0.98] transition-transform duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 min-h-[108px]"
    >
      {/* Civic = decorative gold bar; report = thin error accent only */}
      <span
        className={`absolute top-0 left-0 w-full ${isReport ? "h-0.5 bg-error" : "h-1 bg-secondary-container"}`}
        aria-hidden="true"
      />
      <span className="flex flex-col gap-sm items-start">
        <span
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isReport ? "bg-error-container text-error" : "bg-secondary-fixed text-secondary"
          }`}
        >
          {isReport ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className="text-label-md text-on-surface font-semibold leading-snug">{title}</span>
      </span>
    </button>
  );
};
