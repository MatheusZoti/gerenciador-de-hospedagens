"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";
import { SIDEBAR_COOKIE } from "./sidebar-state";
import { type MenuUser, UserMenu } from "./user-menu";

export function AppSidebar({
  user,
  organizationName,
  defaultCollapsed,
}: {
  user: MenuUser;
  organizationName: string;
  defaultCollapsed: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    // biome-ignore lint/suspicious/noDocumentCookie: preferência simples de UI, lida no servidor.
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-sidebar-border border-r bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-0")}>
        <Brand organizationName={organizationName} compact={collapsed} />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <NavLinks collapsed={collapsed} />
      </div>

      <div className="flex flex-col gap-1 border-sidebar-border border-t p-3">
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "flex h-8 items-center gap-3 rounded-md px-3 text-muted-foreground text-xs outline-none transition-colors hover:bg-black/[0.04] hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-4" aria-hidden />
              Recolher menu
            </>
          )}
        </button>
        <UserMenu user={user} collapsed={collapsed} />
      </div>
    </aside>
  );
}
