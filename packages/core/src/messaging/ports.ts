/**
 * Porta de mensageria. Hoje só existe o provedor de link (`wa.me`); a fase 4
 * adiciona a WhatsApp Cloud API implementando `send`, sem mudar quem usa.
 */
export interface MessagingProvider {
  readonly id: string;
  /** Link que abre a conversa com o contato, opcionalmente com texto preenchido. */
  getConversationLink(phone: string, text?: string): string | null;
  /** Envio direto pelo app (apenas provedores com API). */
  send?(input: { to: string; text: string }): Promise<{ externalId: string }>;
}
