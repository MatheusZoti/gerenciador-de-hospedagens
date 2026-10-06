import "server-only";
import {
  type BoardColumn,
  composeLeadMessage,
  type MessageTemplates,
  type MessagingProvider,
  pickTemplate,
  WaMeLinkProvider,
} from "@hospedagens/core";
import { formatMessageTime, formatPeriod } from "@/lib/format";
import type { KanbanColumn } from "./kanban-types";

const messaging: MessagingProvider = new WaMeLinkProvider();

export interface KanbanContext {
  timeZone: string;
  organizationName: string;
  templates: MessageTemplates;
}

/** Link do WhatsApp com o modelo de mensagem da etapa do lead. */
export function whatsappLinkFor(
  lead: {
    name: string;
    phone: string | null;
    stageId: string;
    propertyName: string | null;
    desiredCheckIn: string | null;
    desiredCheckOut: string | null;
    guests: number | null;
  },
  { templates, organizationName }: Pick<KanbanContext, "templates" | "organizationName">,
): string | null {
  if (!lead.phone) return null;
  const text = composeLeadMessage(pickTemplate(templates, lead.stageId), lead, {
    organizationName,
  });
  return messaging.getConversationLink(lead.phone, text);
}

export function toKanbanColumns(columns: BoardColumn[], context: KanbanContext): KanbanColumn[] {
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
        ? formatMessageTime(lead.lastMessageAt, { timeZone: context.timeZone })
        : "Sem mensagens",
      periodLabel: formatPeriod(lead.desiredCheckIn, lead.desiredCheckOut),
      whatsappUrl: whatsappLinkFor(lead, context),
    })),
  }));
}
