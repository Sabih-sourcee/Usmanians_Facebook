import React, { useCallback, useEffect, useState } from "react";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushPermissionState,
  isIosSafari,
  isStandaloneDisplay,
  type PushPermissionState,
} from "../lib/push";

interface Props {
  userId: string;
}

export const PushNotificationToggle: React.FC<Props> = ({ userId }) => {
  const [state, setState] = useState<PushPermissionState>("default");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await getPushPermissionState(userId);
    setState(next);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onEnable = async () => {
    setBusy(true);
    setMessage(null);
    const { error } = await enablePushNotifications(userId);
    setBusy(false);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage("Push notifications enabled on this device.");
    await refresh();
  };

  const onDisable = async () => {
    setBusy(true);
    setMessage(null);
    const { error } = await disablePushNotifications(userId);
    setBusy(false);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage("Push notifications disabled on this device.");
    await refresh();
  };

  const iosNeedsInstall = isIosSafari() && !isStandaloneDisplay();

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-md space-y-sm">
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <h3 className="text-body-md font-semibold text-on-surface">Push notifications</h3>
          <p className="text-body-sm text-on-surface-variant mt-xs">
            Get likes, comments, and friend requests even when Usmanian is closed.
          </p>
        </div>
      </div>

      {iosNeedsInstall && (
        <p className="text-body-sm text-secondary bg-secondary-fixed/40 rounded-lg p-sm">
          On iPhone, tap Share → Add to Home Screen, open Usmanian from the home screen icon, then enable notifications here.
        </p>
      )}

      {state === "unsupported" && !iosNeedsInstall && (
        <p className="text-body-sm text-on-surface-variant">
          This browser does not support web push.
        </p>
      )}

      {state === "denied" && (
        <p className="text-body-sm text-error">
          Notifications are blocked. Enable them in your browser or system settings, then try again.
        </p>
      )}

      <div className="flex flex-wrap gap-sm">
        {state !== "subscribed" && state !== "unsupported" && state !== "denied" && (
          <button
            type="button"
            disabled={busy || iosNeedsInstall}
            onClick={() => void onEnable()}
            className="min-h-[44px] px-md rounded-lg bg-primary text-on-primary text-label-md font-semibold disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Enabling…" : "Enable notifications"}
          </button>
        )}
        {state === "subscribed" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDisable()}
            className="min-h-[44px] px-md rounded-lg border border-outline-variant text-on-surface text-label-md font-semibold disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Updating…" : "Disable on this device"}
          </button>
        )}
      </div>

      {state === "subscribed" && (
        <p className="text-label-sm text-primary font-medium">Enabled on this device</p>
      )}
      {message && (
        <p className="text-body-sm text-on-surface-variant" role="status">
          {message}
        </p>
      )}
    </div>
  );
};
