import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchPendingProfiles, setVerificationStatus } from "../lib/api/profiles";
import { fetchBanners, upsertBanner } from "../lib/api/banners";
import {
  fetchRedemptionRequests,
  fetchShopItems,
  updateRedemptionStatus,
  updateShopItemFunding,
} from "../lib/api/shop";
import {
  fetchPendingExplainerVideos,
  reviewExplainerVideo,
  submitExplainerVideo,
} from "../lib/api/notes";
import { fetchReferralPrizes, updateReferralPrizeFunding } from "../lib/api/referrals";
import type { ProfileRow, BannerRow } from "../types/database";
import type { ExplainerVideoView, RedemptionRequestView, ReferralPrizeView, ShopItemView } from "../types/models";

type AdminTab = "approvals" | "redemptions" | "shop" | "referrals" | "videos" | "banner";

export const AdminApprovalsPage: React.FC = () => {
  const { profile, user } = useAuth();
  const [tab, setTab] = useState<AdminTab>("approvals");
  const [message, setMessage] = useState<string | null>(null);

  const [pending, setPending] = useState<ProfileRow[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRequestView[]>([]);
  const [shopItems, setShopItems] = useState<ShopItemView[]>([]);
  const [prizes, setPrizes] = useState<ReferralPrizeView[]>([]);
  const [videos, setVideos] = useState<ExplainerVideoView[]>([]);
  const [banner, setBanner] = useState<BannerRow | null>(null);
  const [bannerText, setBannerText] = useState("");
  const [bannerLinkText, setBannerLinkText] = useState("");
  const [bannerLinkUrl, setBannerLinkUrl] = useState("");
  const [bannerActive, setBannerActive] = useState(true);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [awardPoints, setAwardPoints] = useState(100);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const loadApprovals = useCallback(async () => {
    const { data } = await fetchPendingProfiles();
    setPending(data);
  }, []);

  const loadAll = useCallback(async () => {
    const [r, s, p, v, b] = await Promise.all([
      fetchRedemptionRequests(),
      fetchShopItems(),
      fetchReferralPrizes(),
      fetchPendingExplainerVideos(),
      fetchBanners(),
    ]);
    setRedemptions(r.data);
    setShopItems(s.data);
    setPrizes(p.data);
    setVideos(v.data);
    const active = b.data.find((row) => row.is_active) || b.data[0] || null;
    setBanner(active);
    if (active) {
      setBannerText(active.text);
      setBannerLinkText(active.link_text || "");
      setBannerLinkUrl(active.link_url || "");
      setBannerActive(active.is_active);
    }
  }, []);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    void loadApprovals();
    void loadAll();
  }, [profile?.role, loadApprovals, loadAll]);

  if (profile?.role !== "admin") {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-lg text-center">
        <p className="text-body-md text-on-surface-variant">Admin access required.</p>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "approvals", label: "Approvals" },
    { id: "redemptions", label: "Redemptions" },
    { id: "shop", label: "Shop" },
    { id: "referrals", label: "Referral prizes" },
    { id: "videos", label: "Videos" },
    { id: "banner", label: "Banner" },
  ];

  return (
    <div className="flex flex-col w-full gap-md">
      <h2 className="text-headline-md text-on-surface">Admin</h2>
      {message && (
        <div className="bg-primary text-on-primary p-md rounded-xl text-body-sm text-center" role="status">
          {message}
        </div>
      )}

      <div className="flex gap-xs overflow-x-auto pb-xs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 min-h-[40px] px-md rounded-full text-label-md font-semibold cursor-pointer ${
              tab === t.id ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "approvals" && (
        <ul className="flex flex-col gap-sm list-none p-0 m-0">
          {pending.length === 0 ? (
            <p className="text-body-md text-on-surface-variant text-center py-lg">No pending registrations.</p>
          ) : (
            pending.map((p) => (
              <li key={p.id} className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 space-y-sm">
                <p className="text-body-md font-semibold">{p.full_name || "Unnamed"}</p>
                <p className="text-label-sm text-on-surface-variant">
                  {[p.student_cid, p.class_name, p.campus].filter(Boolean).join(" · ")}
                </p>
                <div className="flex gap-sm">
                  <button
                    type="button"
                    className="min-h-[44px] flex-1 bg-primary text-on-primary rounded-xl font-semibold cursor-pointer"
                    onClick={async () => {
                      const { error } = await setVerificationStatus(p.id, "approved");
                      if (error) flash(error);
                      else {
                        flash(`Approved ${p.full_name || "user"}`);
                        await loadApprovals();
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
                      if (error) flash(error);
                      else {
                        flash(`Rejected ${p.full_name || "user"}`);
                        await loadApprovals();
                      }
                    }}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {tab === "redemptions" && (
        <ul className="flex flex-col gap-sm list-none p-0 m-0">
          {redemptions.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">No redemption requests.</p>
          ) : (
            redemptions.map((r) => (
              <li key={r.id} className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 space-y-sm">
                <p className="font-semibold">{r.shopItemName}</p>
                <p className="text-label-sm text-on-surface-variant">
                  {r.userName} · {r.status}
                </p>
                <div className="flex gap-sm flex-wrap">
                  {(["approved", "fulfilled", "rejected"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      className="min-h-[40px] px-md rounded-lg bg-surface-container font-semibold text-label-sm cursor-pointer capitalize"
                      onClick={async () => {
                        const { error } = await updateRedemptionStatus(r.id, status);
                        if (error) flash(error);
                        else {
                          flash(`Marked ${status}`);
                          await loadAll();
                        }
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {tab === "shop" && (
        <ul className="flex flex-col gap-sm list-none p-0 m-0">
          {shopItems.map((item) => (
            <li key={item.id} className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 flex justify-between items-center gap-sm">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-label-sm text-on-surface-variant">{item.pointCost} pts · stock {item.stockCount}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const { error } = await updateShopItemFunding(item.id, !item.isFunded);
                  if (error) flash(error);
                  else await loadAll();
                }}
                className="min-h-[40px] px-md rounded-lg bg-primary text-on-primary font-semibold cursor-pointer"
              >
                {item.isFunded ? "Funded" : "Mark funded"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {tab === "referrals" && (
        <ul className="flex flex-col gap-sm list-none p-0 m-0">
          {prizes.map((prize) => (
            <li key={prize.id} className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 flex justify-between items-center gap-sm">
              <div>
                <p className="font-semibold">{prize.title}</p>
                <p className="text-label-sm text-on-surface-variant">Rank {prize.rankMin}–{prize.rankMax}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const { error } = await updateReferralPrizeFunding(prize.id, !prize.isFunded);
                  if (error) flash(error);
                  else await loadAll();
                }}
                className="min-h-[40px] px-md rounded-lg bg-primary text-on-primary font-semibold cursor-pointer"
              >
                {prize.isFunded ? "Funded" : "Mark funded"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {tab === "videos" && (
        <div className="space-y-md">
          {user && (
            <form
              className="bg-surface-container-low rounded-xl p-md space-y-sm"
              onSubmit={async (e) => {
                e.preventDefault();
                const { error } = await submitExplainerVideo({
                  userId: user.id,
                  title: videoTitle,
                  videoUrl,
                });
                if (error) flash(error);
                else {
                  flash("Video submitted for review");
                  setVideoTitle("");
                  setVideoUrl("");
                }
              }}
            >
              <p className="text-label-md font-semibold">Submit explainer video (any user)</p>
              <input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Title" required className="w-full h-11 px-md rounded-lg border border-outline-variant/40" />
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Video URL" className="w-full h-11 px-md rounded-lg border border-outline-variant/40" />
              <button type="submit" className="min-h-[44px] w-full rounded-lg bg-primary text-on-primary font-semibold cursor-pointer">Submit</button>
            </form>
          )}
          <input
            type="number"
            value={awardPoints}
            onChange={(e) => setAwardPoints(Number(e.target.value))}
            className="w-32 h-11 px-md rounded-lg border border-outline-variant/40"
            aria-label="Points to award"
          />
          <ul className="flex flex-col gap-sm list-none p-0 m-0">
            {videos.map((v) => (
              <li key={v.id} className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 space-y-sm">
                <p className="font-semibold">{v.title}</p>
                <p className="text-label-sm text-on-surface-variant">{v.userName}</p>
                {v.videoUrl && (
                  <a href={v.videoUrl} target="_blank" rel="noreferrer" className="text-primary text-label-md">
                    View video
                  </a>
                )}
                <div className="flex gap-sm">
                  <button
                    type="button"
                    className="min-h-[40px] flex-1 rounded-lg bg-primary text-on-primary font-semibold cursor-pointer"
                    onClick={async () => {
                      const { error } = await reviewExplainerVideo(v.id, true, awardPoints);
                      if (error) flash(error);
                      else {
                        flash(`Approved +${awardPoints} pts`);
                        await loadAll();
                      }
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="min-h-[40px] flex-1 rounded-lg border border-outline-variant font-semibold cursor-pointer"
                    onClick={async () => {
                      const { error } = await reviewExplainerVideo(v.id, false);
                      if (error) flash(error);
                      else await loadAll();
                    }}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "banner" && (
        <form
          className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 space-y-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await upsertBanner({
              id: banner?.id,
              text: bannerText,
              linkText: bannerLinkText,
              linkUrl: bannerLinkUrl,
              isActive: bannerActive,
            });
            if (error) flash(error);
            else flash("Banner updated");
          }}
        >
          <input value={bannerText} onChange={(e) => setBannerText(e.target.value)} placeholder="Banner text" required className="w-full h-11 px-md rounded-lg border border-outline-variant/40" />
          <input value={bannerLinkText} onChange={(e) => setBannerLinkText(e.target.value)} placeholder="Link label" className="w-full h-11 px-md rounded-lg border border-outline-variant/40" />
          <input value={bannerLinkUrl} onChange={(e) => setBannerLinkUrl(e.target.value)} placeholder="Link URL (e.g. /referrals)" className="w-full h-11 px-md rounded-lg border border-outline-variant/40" />
          <label className="flex items-center gap-sm min-h-[44px] cursor-pointer">
            <input type="checkbox" checked={bannerActive} onChange={(e) => setBannerActive(e.target.checked)} className="accent-primary" />
            <span>Active</span>
          </label>
          <button type="submit" className="min-h-[44px] w-full rounded-lg bg-primary text-on-primary font-semibold cursor-pointer">Save banner</button>
        </form>
      )}
    </div>
  );
};
