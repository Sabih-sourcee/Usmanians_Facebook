import { supabase } from "../supabase";
import type { RedemptionRequestRow, ShopItemRow } from "../../types/database";
import type { RedemptionRequestView, ShopItemView } from "../../types/models";

function mapShopItem(row: ShopItemRow): ShopItemView {
  return {
    id: row.id,
    name: row.name,
    category: row.category as ShopItemView["category"],
    pointCost: row.point_cost,
    stockCount: row.stock_count,
    isFunded: row.is_funded,
    description: row.description,
  };
}

export async function fetchShopItems(): Promise<{ data: ShopItemView[]; error: string | null }> {
  const { data, error } = await supabase.from("shop_items").select("*").order("category").order("point_cost");
  if (error) return { data: [], error: error.message };
  return { data: ((data || []) as ShopItemRow[]).map(mapShopItem), error: null };
}

export async function redeemShopItem(
  userId: string,
  itemId: string
): Promise<{ error: string | null }> {
  void userId;
  const { error } = await supabase.rpc("redeem_shop_item", { p_item_id: itemId });
  return { error: error?.message || null };
}

export async function fetchRedemptionRequests(): Promise<{
  data: RedemptionRequestView[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("redemption_requests")
    .select("*, shop_item:shop_items(name), user:profiles!user_id(full_name)")
    .order("created_at", { ascending: false });
  if (error) return { data: [], error: error.message };

  type Row = RedemptionRequestRow & {
    shop_item: { name: string } | null;
    user: { full_name: string | null } | null;
  };

  return {
    data: ((data || []) as Row[]).map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user?.full_name || "Usmanian",
      shopItemId: r.shop_item_id,
      shopItemName: r.shop_item?.name || "Reward",
      status: r.status as RedemptionRequestView["status"],
      createdAt: r.created_at,
    })),
    error: null,
  };
}

export async function updateRedemptionStatus(
  requestId: string,
  status: RedemptionRequestView["status"]
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("redemption_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId);
  return { error: error?.message || null };
}

export async function updateShopItemFunding(
  itemId: string,
  isFunded: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("shop_items").update({ is_funded: isFunded }).eq("id", itemId);
  return { error: error?.message || null };
}
