"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";
import { type MenuUser, UserMenu } from "./user-menu";

export function MobileNav({
  user,
  organizationName,
}: {
  user: MenuUser;
  organizationName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Abrir menu" className="-ml-2">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent aria-describedby={undefined}>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex h-16 items-center px-4">
            <Brand organizationName={organizationName} />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          <div className="border-sidebar-border border-t p-3">
            <UserMenu user={user} />
          </div>
        </SheetContent>
      </Sheet>
      <Brand organizationName={organizationName} />
    </header>
  );
}
