import type * as React from "react";
import { cn } from "@/lib/utils";
import type { KanbanColumn } from "../kanban-types";
import { StageLabel } from "./stage-label";

/** Moldura de uma coluna do Kanban: cabeçalho com etapa e contagem. */
export function KanbanColumnShell({
  stage,
  count,
  className,
  children,
  ref,
}: {
  stage: KanbanColumn["stage"];
  count: number;
  className?: string;
  children: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
}) {
  return (
    <section
      ref={ref}
      aria-label={stage.name}
      className={cn("flex flex-col gap-2 rounded-xl bg-muted/70 p-2", className)}
    >
      <header className="flex items-center justify-between gap-2 px-1.5 pt-1 pb-0.5">
        <StageLabel
          name={stage.name}
          color={stage.color}
          className="font-medium text-foreground text-sm"
        />
        <span className="rounded-md bg-card px-1.5 py-0.5 font-medium text-muted-foreground text-xs tabular-nums ring-1 ring-border">
          {count}
        </span>
      </header>
      {children}
    </section>
  );
}

export function EmptyColumn() {
  return (
    <p className="rounded-lg border border-dashed px-3 py-6 text-center text-muted-foreground text-xs">
      Nenhum lead nesta etapa
    </p>
  );
}
