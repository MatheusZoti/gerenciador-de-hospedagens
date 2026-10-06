import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Relatórios" };

export default function RelatoriosPage() {
  return (
    <ComingSoon
      title="Relatórios"
      description="Indicadores de vendas e de desempenho dos imóveis."
      phase="Fase 6"
      icon={BarChart3}
      features={[
        "Conversão por etapa do funil e por origem do lead",
        "Taxa de ocupação, diária média (ADR) e RevPAR por imóvel",
        "Receita por imóvel e por canal (direto × Airbnb)",
        "Exportação em planilha",
      ]}
    />
  );
}
