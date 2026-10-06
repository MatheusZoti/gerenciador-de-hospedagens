import { normalizePhone } from "./phone";
import type { MessagingProvider } from "./ports";

/** Abre a conversa no WhatsApp Web/app via `https://wa.me/<telefone>?text=...`. */
export class WaMeLinkProvider implements MessagingProvider {
  readonly id = "wa.me";

  getConversationLink(phone: string, text?: string): string | null {
    const normalized = normalizePhone(phone);
    if (!normalized) return null;

    const url = new URL(`https://wa.me/${normalized}`);
    if (text?.trim()) url.searchParams.set("text", text.trim());
    return url.toString();
  }
}

/** Mensagem inicial padrão. Na fase 1 vira modelo configurável por etapa. */
export function defaultWhatsAppMessage(input: { leadName: string; propertyName?: string | null }) {
  const firstName = input.leadName.trim().split(/\s+/)[0] ?? "";
  const greeting = firstName ? `Olá, ${firstName}! Tudo bem?` : "Olá! Tudo bem?";
  return input.propertyName
    ? `${greeting} Estou entrando em contato sobre a hospedagem ${input.propertyName}.`
    : greeting;
}
