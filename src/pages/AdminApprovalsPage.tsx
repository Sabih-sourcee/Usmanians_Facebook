import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchPendingProfiles, setVerificationStatus } from "../lib/api/profiles";
import type { ProfileRow } from "../types/database";

export const AdminApprovalsPage: React.FC = () => {
  const { profile } = useAuth();
  const [pending, setPending] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchPendingProfiles();
    setLoading(false);
    if (error) setMessage(error);
    else setPending(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (profile?.role !== "admin") {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-lg text-center">
        <p className="text-body-md text-on-surface-variant">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-md">
      <h2 className="text-headline-md text-on-surface">Pending approvals</h2>
      {message && (
        <div className="bg-primary text-on-primary p-md rounded-xl text-body-sm text-center" role="status">
          {message}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-xl">
          <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pending.length === 0 ? (
        <p className="text-body-md text-on-surface-variant text-center py-lg">No pending registrations.</p>
      ) : (
        <ul className="flex flex-col gap-sm list-none p-0 m-0">
          {pending.map((p) => (
            <li
              key={p.id}
              className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 space-y-sm"
            >
              <div>
                <p className="text-body-md font-semibold">{p.full_name || "Unnamed"}</p>
                <p className="text-label-sm text-on-surface-variant">
                  {[p.student_cid, p.class_name, p.campus].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex gap-sm">
                <button
                  type="button"
                  className="min-h-[44px] flex-1 bg-primary text-on-primary rounded-xl font-semibold cursor-pointer"
                  onClick={async () => {
                    const { error } = await setVerificationStatus(p.id, "approved");
                    if (error) setMessage(error);
                    else {
                      setMessage(`Approved ${p.full_name || "user"}`);
                      await load();
                    }
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="min-h-[44px] flex-1 bg-surface-container-high text-on-surface rounded-xl font-semibold cursor-pointer"
                  onClick={async () => {
                    const { error } = await setVerificationStatus(p.id, "rejected");
                    if (error) setMessage(error);
                    else {
                      setMessage(`Rejected ${p.full_name || "user"}`);
                      await load();
                    }
                  }}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
