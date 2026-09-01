import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { PointsService } from "../lib/api/points";
import { fetchShopItems, redeemShopItem } from "../lib/api/shop";
import type { ShopItemView } from "../types/models";

export const RewardsPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItemView[]>([]);
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void fetchShopItems().then(({ data }) => setItems(data));
    if (user) void PointsService.getBalance(user.id).then(({ balance: b }) => setBalance(b));
  }, [user]);

  const redeem = async (item: ShopItemView) => {
    if (!user) return;
    setBusyId(item.id);
    setMessage(null);
    const { error } = await redeemShopItem(user.id, item.id);
    setBusyId(null);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage(`Redemption requested for ${item.name}. An admin will review it.`);
    const { balance: b } = await PointsService.getBalance(user.id);
    setBalance(b);
    void fetchShopItems().then(({ data }) => setItems(data));
  };

  const renderSection = (title: string, category: ShopItemView["category"]) => (
    <section className="space-y-sm">
      <h3 className="text-headline-md text-on-surface">{title}</h3>
      <ul className="flex flex-col gap-sm list-none p-0 m-0">
        {items.filter((i) => i.category === category).map((item) => (
          <li key={item.id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md space-y-xs">
            <div className="flex justify-between gap-sm items-start">
              <div>
                <p className="text-body-md font-semibold">{item.name}</p>
                {item.description && <p className="text-body-sm text-on-surface-variant">{item.description}</p>}
              </div>
              <span className="text-label-md font-semibold text-secondary shrink-0">{item.pointCost} pts</span>
            </div>
            {!item.isFunded ? (
              <p className="text-label-sm text-secondary font-medium">Coming soon — pending sponsorship</p>
            ) : (
              <p className="text-label-sm text-on-surface-variant">{item.stockCount} in stock</p>
            )}
            <button
              type="button"
              disabled={!item.isFunded || item.stockCount <= 0 || balance < item.pointCost || busyId === item.id}
              onClick={() => void redeem(item)}
              className="min-h-[44px] w-full rounded-lg bg-primary text-on-primary font-semibold disabled:opacity-50 cursor-pointer"
            >
              {busyId === item.id ? "Requesting…" : item.isFunded ? "Redeem" : "Not available yet"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="flex flex-col gap-md">
      <div className="bg-primary-fixed rounded-xl p-md flex justify-between items-center">
        <span className="text-body-md font-semibold text-on-primary-fixed">Your balance</span>
        <span className="text-headline-md font-bold text-primary">{balance} pts</span>
      </div>
      {message && <p className="text-body-sm text-center text-on-surface-variant" role="status">{message}</p>}
      {renderSection("Gamer & tech", "gamer_tech")}
      {renderSection("Educational", "educational")}
    </div>
  );
};
