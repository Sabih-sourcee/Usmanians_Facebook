import React, { useEffect, useState } from "react";
import {
  isIosSafari,
  isStandaloneDisplay,
  isPushSupported,
} from "../lib/push";

const DISMISS_KEY = "usmanian_install_banner_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const InstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (isStandaloneDisplay()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // iOS Safari never fires beforeinstallprompt — show manual instructions
    if (isIosSafari() && !isStandaloneDisplay()) {
      setShowIos(true);
      setVisible(true);
    } else if (!isPushSupported() && /Android/i.test(navigator.userAgent)) {
      // Rare Android browsers without BIP — still hint to install
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-margin-mobile pointer-events-none"
      role="region"
      aria-label="Install Usmanian"
    >
      <div className="max-w-2xl mx-auto pointer-events-auto bg-surface-container-lowest border border-outline-variant/40 shadow-lg rounded-xl p-md flex gap-md items-start">
        <img
          src="/icons/icon-192.png"
          alt=""
          className="w-11 h-11 rounded-lg object-contain shrink-0 bg-surface-container"
          width={44}
          height={44}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-on-surface text-body-md">Install Usmanian</p>
          {showIos ? (
            <p className="text-body-sm text-on-surface-variant mt-xs">
              Tap Share → Add to Home Screen to enable notifications on iPhone.
            </p>
          ) : (
            <p className="text-body-sm text-on-surface-variant mt-xs">
              Add to your home screen for faster access and push notifications when the app is closed.
            </p>
          )}
          <div className="flex flex-wrap gap-sm mt-sm">
            {deferred && (
              <button
                type="button"
                onClick={() => void install()}
                className="min-h-[44px] px-md rounded-lg bg-primary text-on-primary text-label-md font-semibold cursor-pointer"
              >
                Install
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="min-h-[44px] px-md rounded-lg text-label-md font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
