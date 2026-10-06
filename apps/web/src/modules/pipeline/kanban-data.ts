import "server-only";
import {
  type BoardColumn,
  defaultWhatsAppMessage,
  type MessagingProvider,
  WaMeLinkProvider,
} from "@hospedagens/core";
import { DEFAULT_TIME_ZONE, formatMessageTime, formatPeriod } from "@/lib/format";
import type { KanbanColumn } from "./kanban-types";

const messaging: MessagingProvider = new WaMeLinkProvider();

export function toKanbanColumns(
  columns: BoardColumn[],
  { timeZone = DEFAULT_TIME_ZONE }: { timeZone?: string } = {},
): KanbanColumn[] {
  return columns.map((column) => ({
    stage: {
      id: column.stage.id,
      name: column.stage.name,
      color: column.stage.color,
      kind: column.stage.kind,
    },
    total: column.total,
    cards: column.leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      href: `/leads/${lead.id}`,
      propertyName: lead.propertyName,
      lastMessageLabel: lead.lastMessageAt
        ? formatMessageTime(lead.lastMessageAt, { timeZone })
        : "Sem mensagens",
      periodLabel: formatPeriod(lead.desiredCheckIn, lead.desiredCheckOut),
      whatsappUrl: lead.phone
        ? messaging.getConversationLink(
            lead.phone,
            defaultWhatsAppMessage({ leadName: lead.name, propertyName: lead.propertyName }),
          )
        : null,
    })),
  }));
}
