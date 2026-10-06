import type { BoardColumn } from "@hospedagens/core";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LeadCard } from "./lead-card";
import { StageLabel } from "./stage-label";

/**
 * Quadro do funil. `variant="preview"` é a versão do dashboard (grade, poucos
 * cards por coluna); `variant="full"` é a página Kanban (rolagem horizontal).
 * O arrastar-e-soltar entra na fase 1.
 */
export function KanbanBoard({
  columns,
  variant = "full",
}: {
  columns: BoardColumn[];
  variant?: "preview" | "full";
}) {
  return (
    <div
      className={cn(
        variant === "preview"
          ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          : "relative -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8",
      )}
    >
      {columns.map((column) => {
        const hidden = column.total - column.leads.length;
        return (
          <section
            key={column.stage.id}
            aria-label={column.stage.name}
            className={cn(
              "flex flex-col gap-2 rounded-xl bg-muted/70 p-2",
              variant === "full" && "w-72 shrink-0 snap-start",
            )}
          >
            <header className="flex items-center justify-between gap-2 px-1.5 pt-1 pb-0.5">
              <StageLabel
                name={column.stage.name}
                color={column.stage.color}
                className="font-medium text-foreground text-sm"
              />
              <span className="rounded-md bg-card px-1.5 py-0.5 font-medium text-muted-foreground text-xs tabular-nums ring-1 ring-border">
                {column.total}
              </span>
            </header>

            {column.leads.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-6 text-center text-muted-foreground text-xs">
                Nenhum lead nesta etapa
              </p>
            ) : (
              column.leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
            )}

            {hidden > 0 ? (
              <Link
                href="/kanban"
                className="rounded-md px-2 py-1.5 text-center font-medium text-primary text-xs hover:bg-card"
              >
                + {hidden} {hidden === 1 ? "lead" : "leads"} no Kanban
              </Link>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
