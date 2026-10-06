"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "./nav-items";

export function NavLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu principal" className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <p
            className={cn(
              "px-3 pb-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wider",
              collapsed && "sr-only",
            )}
          >
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group flex h-9 items-center gap-3 rounded-md px-3 font-medium text-sidebar-foreground text-sm outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  active && "bg-card text-foreground shadow-xs ring-1 ring-border",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground",
                    active && "text-primary group-hover:text-primary",
                  )}
                  aria-hidden
                />
                <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
