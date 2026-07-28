import React, { useEffect, useId, useRef } from "react";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  title,
  onClose,
  children,
  footer,
}) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-surface-container-lowest w-full max-w-lg sm:max-w-sm rounded-t-2xl sm:rounded-xl shadow-xl border border-outline-variant/20 max-h-[85dvh] flex flex-col pb-safe"
      >
        <div className="flex items-center justify-between gap-sm px-md pt-md pb-sm border-b border-outline-variant/30 shrink-0">
          <h3 id={titleId} className="text-headline-md text-on-surface truncate">
            {title}
          </h3>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-md py-md overscroll-contain">{children}</div>
        {footer ? <div className="px-md pb-md pt-sm border-t border-outline-variant/30 shrink-0">{footer}</div> : null}
      </div>
    </div>
  );
};
