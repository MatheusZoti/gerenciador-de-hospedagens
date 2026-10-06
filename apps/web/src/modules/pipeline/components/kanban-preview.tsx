import Link from "next/link";
import type { KanbanColumn } from "../kanban-types";
import { EmptyColumn, KanbanColumnShell } from "./kanban-column-shell";
import { LeadCard } from "./lead-card";

/** Prévia estática do Kanban no dashboard (poucos cards por coluna). */
export function KanbanPreview({ columns }: { columns: KanbanColumn[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {columns.map((column) => {
        const hidden = column.total - column.cards.length;
        return (
          <KanbanColumnShell key={column.stage.id} stage={column.stage} count={column.total}>
            {column.cards.length === 0 ? (
              <EmptyColumn />
            ) : (
              column.cards.map((card) => <LeadCard key={card.id} card={card} />)
            )}
            {hidden > 0 ? (
              <Link
                href="/kanban"
                className="rounded-md px-2 py-1.5 text-center font-medium text-primary text-xs hover:bg-card"
              >
                + {hidden} {hidden === 1 ? "lead" : "leads"} no Kanban
              </Link>
            ) : null}
          </KanbanColumnShell>
        );
      })}
    </div>
  );
}
