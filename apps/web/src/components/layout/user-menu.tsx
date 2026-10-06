"use client";

import { ChevronsUpDown, LogOut, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn, initials } from "@/lib/utils";

export interface MenuUser {
  name: string;
  email: string;
  image?: string | null;
  jobTitle?: string | null;
}

export function UserMenu({ user, collapsed = false }: { user: MenuUser; collapsed?: boolean }) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-md p-2 text-left outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-[3px] focus-visible:ring-ring/50",
          collapsed && "justify-center",
        )}
      >
        <Avatar className="size-8">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <span className={cn("min-w-0 flex-1 leading-tight", collapsed && "sr-only")}>
          <span className="block truncate font-medium text-sm">{user.name}</span>
          <span className="block truncate text-muted-foreground text-xs">
            {user.jobTitle || user.email}
          </span>
        </span>
        <ChevronsUpDown
          className={cn("size-4 text-muted-foreground", collapsed && "hidden")}
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel>
          <span className="block truncate font-medium">{user.name}</span>
          <span className="block truncate font-normal text-muted-foreground text-xs">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/perfil")}>
          <UserRound /> Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/configuracoes")}>
          <Settings /> Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
