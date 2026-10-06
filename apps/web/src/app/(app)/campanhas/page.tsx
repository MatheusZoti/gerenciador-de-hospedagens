import { Megaphone } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Campanhas" };

export default function CampanhasPage() {
  return (
    <ComingSoon
      title="Campanhas"
      description="Reative hóspedes e leads com mensagens segmentadas."
      phase="Fase 6"
      icon={Megaphone}
      features={[
        "Segmentos por etapa, origem, imóvel, período e histórico de estadias",
        "Disparos por modelos aprovados do WhatsApp",
        "Campanhas de datas especiais (aniversário, feriados, temporada)",
        "Métricas de entrega, resposta e conversão em reserva",
      ]}
    />
  );
}
