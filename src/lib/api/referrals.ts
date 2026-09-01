import { supabase } from "../supabase";
import type { ReferralPrizeRow, ReferralRow } from "../../types/database";
import type { ReferralLeaderboardEntry, ReferralPrizeView } from "../../types/models";

export async function ensureReferralCode(userId: string): Promise<{ code: string | null; error: string | null }> {
  const { data, error } = await supabase.from("profiles").select("referral_code").eq("id", userId).single();
  if (error) return { code: null, error: error.message };
  const existing = (data as { referral_code: string | null }).referral_code;
  if (existing) return { code: existing, error: null };

  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  const { error: updateErr } = await supabase.from("profiles").update({ referral_code: code }).eq("id", userId);
  if (updateErr) return { code: null, error: updateErr.message };
  return { code, error: null };
}

export async function recordReferral(referrerCode: string, referredUserId: string): Promise<{ error: string | null }> {
  const { data: referrer, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", referrerCode.trim().toUpperCase())
    .maybeSingle();
  if (error) return { error: error.message };
  if (!referrer) return { error: null };
  const referrerId = (referrer as { id: string }).id;
  if (referrerId === referredUserId) return { error: null };

  const { error: insertErr } = await supabase.from("referrals").insert({
    referrer_id: referrerId,
    referred_id: referredUserId,
  });
  if (insertErr && !insertErr.message.includes("duplicate")) return { error: insertErr.message };
  return { error: null };
}

export async function fetchReferralCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", userId);
  return count || 0;
}

export async function fetchReferralLeaderboard(limit = 20): Promise<{
  data: ReferralLeaderboardEntry[];
  error: string | null;
}> {
  const { data, error } = await supabase.from("referrals").select("referrer_id");
  if (error) return { data: [], error: error.message };

  const counts = new Map<string, number>();
  for (const row of (data || []) as Pick<ReferralRow, "referrer_id">[]) {
    counts.set(row.referrer_id, (counts.get(row.referrer_id) || 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (!sorted.length) return { data: [], error: null };

  const ids = sorted.map(([id]) => id);
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
  const names = new Map(
    ((profiles || []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name || "Usmanian"])
  );

  return {
    data: sorted.map(([userId, count], index) => ({
      rank: index + 1,
      userId,
      userName: names.get(userId) || "Usmanian",
      referralCount: count,
    })),
    error: null,
  };
}

export async function fetchReferralPrizes(): Promise<{ data: ReferralPrizeView[]; error: string | null }> {
  const { data, error } = await supabase.from("referral_prizes").select("*").order("rank_min");
  if (error) return { data: [], error: error.message };
  return {
    data: ((data || []) as ReferralPrizeRow[]).map((p) => ({
      id: p.id,
      rankMin: p.rank_min,
      rankMax: p.rank_max,
      title: p.title,
      description: p.description,
      isFunded: p.is_funded,
    })),
    error: null,
  };
}

export async function updateReferralPrizeFunding(
  prizeId: string,
  isFunded: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("referral_prizes").update({ is_funded: isFunded }).eq("id", prizeId);
  return { error: error?.message || null };
}
