import { Users } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return (
    <ComingSoon
      title="Leads"
      description="Ficha completa de cada pessoa interessada, com histórico e datas importantes."
      phase="Fase 1"
      icon={Users}
      features={[
        "Lista com busca e filtros por etapa, origem e imóvel de interesse",
        "Ficha completa: contato, período desejado, hóspedes, observações",
        "Datas importantes (aniversário, última estadia) para relacionamento",
        "Linha do tempo com mudanças de etapa, notas e mensagens",
        "Cadastro rápido e importação de planilha (CSV)",
      ]}
    />
  );
}
