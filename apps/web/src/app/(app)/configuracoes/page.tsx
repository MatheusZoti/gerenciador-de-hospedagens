import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Configurações" };

export default function ConfiguracoesPage() {
  return (
    <ComingSoon
      title="Configurações"
      description="Ajustes da organização, do funil e das integrações."
      phase="Fase 1"
      icon={Settings}
      features={[
        "Dados da organização (nome, logo, fuso horário)",
        "Cadastro de imóveis",
        "Etapas do funil: renomear, reordenar e criar novas",
        "Modelos de mensagem do WhatsApp por etapa",
        "Integrações: iCal do Airbnb, WhatsApp e gateway de pagamento",
        "Fase 7: membros da equipe, papéis e plano de assinatura",
      ]}
    />
  );
}
