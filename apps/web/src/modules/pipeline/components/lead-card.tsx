import { CalendarDays, Clock, House, MessageCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KanbanCard } from "../kanban-types";

/** Card de lead (sem lógica): usado na prévia do dashboard e no Kanban. */
export function LeadCard({ card, className }: { card: KanbanCard; className?: string }) {
  return (
    <article
      className={cn("flex flex-col gap-2.5 rounded-lg border bg-card p-3 shadow-xs", className)}
    >
      <div className="flex flex-col gap-1">
        <h3 className="truncate font-medium text-foreground text-sm">
          <Link href={card.href as Route} className="hover:text-primary hover:underline">
            {card.name}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <House className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{card.propertyName ?? "Imóvel não definido"}</span>
        </p>
      </div>

      <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
        <div className="flex items-center gap-1.5">
          <dt>
            <Clock className="size-3.5" aria-hidden />
            <span className="sr-only">Última mensagem</span>
          </dt>
          <dd className="tabular-nums">{card.lastMessageLabel}</dd>
        </div>
        {card.periodLabel ? (
          <div className="flex items-center gap-1.5">
            <dt>
              <CalendarDays className="size-3.5" aria-hidden />
              <span className="sr-only">Período desejado</span>
            </dt>
            <dd className="tabular-nums">{card.periodLabel}</dd>
          </div>
        ) : null}
      </dl>

      {card.whatsappUrl ? (
        <Button asChild variant="whatsapp" size="xs" className="self-start">
          <a href={card.whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            Abrir no WhatsApp
          </a>
        </Button>
      ) : (
        <p className="text-muted-foreground text-xs italic">Sem telefone cadastrado</p>
      )}
    </article>
  );
}
