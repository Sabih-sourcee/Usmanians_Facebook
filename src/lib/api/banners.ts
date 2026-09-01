import { supabase } from "../supabase";
import type { BannerRow } from "../../types/database";
import type { BannerView } from "../../types/models";

export async function fetchActiveBanner(): Promise<{ data: BannerView | null; error: string | null }> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  const row = data as BannerRow;
  return {
    data: { id: row.id, text: row.text, linkText: row.link_text, linkUrl: row.link_url, isActive: row.is_active },
    error: null,
  };
}

export async function fetchBanners(): Promise<{ data: BannerRow[]; error: string | null }> {
  const { data, error } = await supabase.from("banners").select("*").order("created_at", { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: (data || []) as BannerRow[], error: null };
}

export async function upsertBanner(input: {
  id?: string;
  text: string;
  linkText?: string | null;
  linkUrl?: string | null;
  isActive: boolean;
}): Promise<{ error: string | null }> {
  if (input.isActive) {
    await supabase.from("banners").update({ is_active: false }).eq("is_active", true);
  }
  const payload = {
    text: input.text,
    link_text: input.linkText || null,
    link_url: input.linkUrl || null,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };
  if (input.id) {
    const { error } = await supabase.from("banners").update(payload).eq("id", input.id);
    return { error: error?.message || null };
  }
  const { error } = await supabase.from("banners").insert(payload);
  return { error: error?.message || null };
}
