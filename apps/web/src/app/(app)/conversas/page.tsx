import { MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Conversas" };

export default function ConversasPage() {
  return (
    <ComingSoon
      title="Conversas"
      description="Responda no WhatsApp direto pelo app, com cada conversa ligada ao seu lead."
      phase="Fase 4"
      icon={MessagesSquare}
      features={[
        "Caixa de entrada do WhatsApp pela API oficial (Cloud API da Meta)",
        "Responder e enviar modelos de mensagem aprovados sem sair do CRM",
        "Conversa vinculada automaticamente ao lead pelo telefone",
        "Horário da última mensagem atualizado em tempo real no Kanban",
        "Até lá: o botão de WhatsApp dos cards abre a conversa no wa.me",
      ]}
    />
  );
}
