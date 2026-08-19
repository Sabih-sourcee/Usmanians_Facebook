import React, { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { BottomSheet } from "./BottomSheet";
import {
  enablePushNotifications,
  getPushPermissionState,
  isIosSafari,
  isStandaloneDisplay,
  type PushPermissionState,
} from "../lib/push";

export const NotificationPrompt: React.FC = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PushPermissionState | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const next = await getPushPermissionState(user.id);
    setState(next);
    setOpen(next !== "subscribed" && next !== "unsupported");
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onEnable = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    const { error: enableError } = await enablePushNotifications(user.id);
    setBusy(false);
    if (enableError) {
      setError(enableError);
      return;
    }
    await refresh();
  };

  const onDismiss = () => {
    setOpen(false);
  };

  if (!user || state === null || state === "subscribed" || state === "unsupported") {
    return null;
  }

  const iosNeedsInstall = isIosSafari() && !isStandaloneDisplay();

  return (
    <BottomSheet
      open={open}
      title="Enable notifications"
      onClose={onDismiss}
      closeOnBackdropClick={false}
      footer={
        <div className="flex flex-col gap-sm">
          {error && (
            <p className="text-body-sm text-error" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-sm">
            {!iosNeedsInstall && state !== "denied" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onEnable()}
                className="flex-1 min-h-[44px] px-md rounded-lg bg-primary text-on-primary text-label-md font-semibold disabled:opacity-50 cursor-pointer"
              >
                {busy ? "Enabling…" : "Allow notifications"}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={onDismiss}
              className="flex-1 min-h-[44px] px-md rounded-lg border border-outline-variant text-on-surface text-label-md font-semibold disabled:opacity-50 cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center gap-md pb-sm">
        <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center">
          <Bell className="w-7 h-7 text-primary" aria-hidden="true" />
        </div>
        <div className="space-y-xs">
          <p className="text-body-md text-on-surface">
            Stay in the loop with likes, comments, and friend requests — even when Usmanian is closed.
          </p>
          <p className="text-body-sm text-on-surface-variant">
            You can change this anytime from your profile.
          </p>
        </div>

        {iosNeedsInstall && (
          <p className="text-body-sm text-secondary bg-secondary-fixed/40 rounded-lg p-sm text-left w-full">
            On iPhone, tap Share → Add to Home Screen, open Usmanian from the home screen icon, then allow notifications.
          </p>
        )}

        {state === "denied" && (
          <p className="text-body-sm text-error text-left w-full">
            Notifications are blocked in your browser or device settings. Enable them for Usmanian, then reopen the app and tap Allow notifications.
          </p>
        )}
      </div>
    </BottomSheet>
  );
};
