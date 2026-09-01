import { supabase } from "../supabase";
import type { PointTransactionRow } from "../../types/database";

export const PointsService = {
  async getBalance(userId: string): Promise<{ balance: number; error: string | null }> {
    const { data, error } = await supabase
      .from("user_points")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { balance: 0, error: error.message };
    return { balance: (data as { balance: number } | null)?.balance ?? 0, error: null };
  },

  async getTransactionHistory(
    userId: string,
    limit = 20
  ): Promise<{ data: PointTransactionRow[]; error: string | null }> {
    const { data, error } = await supabase
      .from("point_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { data: [], error: error.message };
    return { data: (data || []) as PointTransactionRow[], error: null };
  },

  async claimDailyLogin(): Promise<{ points: number; error: string | null }> {
    const { data, error } = await supabase.rpc("claim_daily_login");
    if (error) return { points: 0, error: error.message };
    return { points: (data as number) || 0, error: null };
  },

  async awardNotePost(postId: string): Promise<{ points: number; error: string | null }> {
    const { data, error } = await supabase.rpc("award_note_post_points", { p_post_id: postId });
    if (error) return { points: 0, error: error.message };
    return { points: (data as number) || 0, error: null };
  },

  async awardComment(): Promise<{ points: number; error: string | null }> {
    const { data, error } = await supabase.rpc("award_comment_points");
    if (error) return { points: 0, error: error.message };
    return { points: (data as number) || 0, error: null };
  },

  async deduct(userId: string, amount: number, reason: string, referenceId?: string): Promise<{ error: string | null }> {
    const { balance, error: balErr } = await this.getBalance(userId);
    if (balErr) return { error: balErr };
    if (balance < amount) return { error: "Insufficient points." };
    const { error } = await supabase.from("point_transactions").insert({
      user_id: userId,
      amount: -amount,
      reason,
      reference_id: referenceId || null,
    });
    if (error) return { error: error.message };
    const { error: updateErr } = await supabase
      .from("user_points")
      .upsert({ user_id: userId, balance: balance - amount, updated_at: new Date().toISOString() });
    return { error: updateErr?.message || null };
  },
};
