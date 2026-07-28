import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  pageTitle?: string;
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ pageTitle, children }) => {
  const location = useLocation();

  let title = pageTitle;
  if (!title) {
    const path = location.pathname;
    if (path === "/" || path === "/feed") title = "Home";
    else if (path.startsWith("/profile")) title = "Profile";
    else if (path.startsWith("/friends") || path.startsWith("/groups")) title = "Friends";
    else if (path.startsWith("/activity")) title = "Activity";
    else if (path.startsWith("/admin")) title = "Approvals";
    else title = "Home";
  }

  return (
    <div className="app-canvas font-body-md text-on-surface min-h-dvh">
      <Header pageTitle={title} />
      <main className="relative pt-[calc(56px+env(safe-area-inset-top,0px))] pb-[calc(80px+env(safe-area-inset-bottom))] px-margin-mobile min-h-dvh max-w-2xl mx-auto w-full">
        <div className="py-md">{children || <Outlet />}</div>
      </main>
      <BottomNav />
    </div>
  );
};
