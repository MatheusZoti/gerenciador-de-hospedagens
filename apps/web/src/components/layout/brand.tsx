import { House } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({
  organizationName,
  compact = false,
}: {
  organizationName: string;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <House className="size-[18px]" aria-hidden />
      </span>
      <span className={cn("min-w-0 leading-tight", compact && "sr-only")}>
        <span className="block font-semibold text-foreground text-sm">Hospedagens CRM</span>
        <span className="block truncate text-muted-foreground text-xs">{organizationName}</span>
      </span>
    </div>
  );
}
