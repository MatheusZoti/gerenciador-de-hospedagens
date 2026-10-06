import {
  type BoardLead,
  defaultWhatsAppMessage,
  type MessagingProvider,
  WaMeLinkProvider,
} from "@hospedagens/core";
import { CalendarDays, Clock, House, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMessageTime, formatShortDate } from "@/lib/format";

const messaging: MessagingProvider = new WaMeLinkProvider();

export function LeadCard({ lead }: { lead: BoardLead }) {
  const whatsappUrl = lead.phone
    ? messaging.getConversationLink(
        lead.phone,
        defaultWhatsAppMessage({ leadName: lead.name, propertyName: lead.propertyName }),
      )
    : null;

  return (
    <article className="flex flex-col gap-2.5 rounded-lg border bg-card p-3 shadow-xs">
      <div className="flex flex-col gap-1">
        <h3 className="truncate font-medium text-foreground text-sm">{lead.name}</h3>
        <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <House className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{lead.propertyName ?? "Imóvel não definido"}</span>
        </p>
      </div>

      <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
        <div className="flex items-center gap-1.5">
          <dt>
            <Clock className="size-3.5" aria-hidden />
            <span className="sr-only">Última mensagem</span>
          </dt>
          <dd className="tabular-nums">
            {lead.lastMessageAt ? formatMessageTime(lead.lastMessageAt) : "Sem mensagens"}
          </dd>
        </div>
        {lead.desiredCheckIn && lead.desiredCheckOut ? (
          <div className="flex items-center gap-1.5">
            <dt>
              <CalendarDays className="size-3.5" aria-hidden />
              <span className="sr-only">Período desejado</span>
            </dt>
            <dd className="tabular-nums">
              {formatShortDate(lead.desiredCheckIn)}–{formatShortDate(lead.desiredCheckOut)}
            </dd>
          </div>
        ) : null}
      </dl>

      {whatsappUrl ? (
        <Button asChild variant="whatsapp" size="xs" className="self-start">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
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
