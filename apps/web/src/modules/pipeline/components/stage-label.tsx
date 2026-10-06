import { cn } from "@/lib/utils";
import { stageDotClass } from "../stage-colors";

export function StageLabel({
  name,
  color,
  className,
  wrap = false,
}: {
  name: string;
  color: string;
  className?: string;
  /** Quebra linha em vez de cortar com reticências. */
  wrap?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex min-w-0 items-center gap-2", wrap && "items-start", className)}
    >
      <span
        className={cn("size-2.5 shrink-0 rounded-full", wrap && "mt-1", stageDotClass(color))}
        aria-hidden
      />
      <span className={wrap ? undefined : "truncate"}>{name}</span>
    </span>
  );
}
