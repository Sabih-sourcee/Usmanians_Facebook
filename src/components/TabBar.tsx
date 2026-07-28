import React, { useState } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabBarProps {
  tabs: TabItem[];
  defaultTabId?: string;
  onTabChange?: (tabId: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  defaultTabId,
  onTabChange,
}) => {
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultTabId || (tabs.length > 0 ? tabs[0].id : "")
  );

  const handleTabClick = (id: string) => {
    setActiveTabId(id);
    onTabChange?.(id);
  };

  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <div className="w-full">
      <nav
        aria-label="Profile section tabs"
        className="sticky top-[calc(56px+env(safe-area-inset-top,0px))] z-10 flex border-b border-outline-variant/40 bg-surface-dim/90 backdrop-blur-md mt-lg"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 min-h-[48px] text-label-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 cursor-pointer ${
                isActive
                  ? "border-b-2 border-primary text-on-surface font-semibold"
                  : "text-on-surface-variant hover:text-on-surface border-b-2 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div
        id={`tabpanel-${currentTab?.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${currentTab?.id}`}
        className="mt-md"
      >
        {currentTab?.content}
      </div>
    </div>
  );
};
