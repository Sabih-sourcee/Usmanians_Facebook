import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ensureReferralCode,
  fetchReferralCount,
  fetchReferralLeaderboard,
  fetchReferralPrizes,
} from "../lib/api/referrals";
import type { ReferralLeaderboardEntry, ReferralPrizeView } from "../types/models";

export const ReferralsPage: React.FC = () => {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<ReferralLeaderboardEntry[]>([]);
  const [prizes, setPrizes] = useState<ReferralPrizeView[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    void ensureReferralCode(user.id).then(({ code: c }) => setCode(c));
    void fetchReferralCount(user.id).then(setCount);
    void fetchReferralLeaderboard().then(({ data }) => setLeaderboard(data));
    void fetchReferralPrizes().then(({ data }) => setPrizes(data));
  }, [user]);

  const referralLink = code ? `${window.location.origin}/signup?ref=${code}` : "";

  const copyLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-md">
      <h2 className="text-headline-md text-on-surface">Referral program</h2>
      <p className="text-body-sm text-on-surface-variant">
        Invite classmates to join Usmanian. Your unique link tracks signups for the leaderboard.
      </p>

      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md space-y-sm">
        <p className="text-label-md text-on-surface-variant">Your referral code</p>
        <p className="text-headline-md font-bold text-primary tracking-wide">{code || "…"}</p>
        <p className="text-body-sm text-on-surface-variant break-all">{referralLink}</p>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="min-h-[44px] w-full rounded-lg bg-primary text-on-primary font-semibold cursor-pointer"
        >
          {copied ? "Copied!" : "Copy referral link"}
        </button>
        <p className="text-label-sm text-on-surface-variant text-center">Your referrals: {count}</p>
      </div>

      <section className="space-y-sm">
        <h3 className="text-headline-md text-on-surface">Leaderboard</h3>
        {leaderboard.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">No referrals yet — be the first!</p>
        ) : (
          <ol className="list-none p-0 m-0 space-y-xs">
            {leaderboard.map((entry) => (
              <li key={entry.userId} className="flex justify-between bg-surface-container-low rounded-lg px-md py-sm">
                <span className="text-body-md">
                  #{entry.rank} {entry.userName}
                  {entry.userId === user?.id ? " (you)" : ""}
                </span>
                <span className="text-label-md font-semibold text-secondary">{entry.referralCount}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-sm">
        <h3 className="text-headline-md text-on-surface">Prize tiers</h3>
        {prizes.map((prize) => (
          <div key={prize.id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
            <p className="text-body-md font-semibold">
              Rank {prize.rankMin}
              {prize.rankMax !== prize.rankMin ? `–${prize.rankMax}` : ""}: {prize.title}
            </p>
            {prize.description && <p className="text-body-sm text-on-surface-variant">{prize.description}</p>}
            {!prize.isFunded && (
              <p className="text-label-sm text-secondary font-medium mt-xs">Coming soon — pending sponsorship</p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};
