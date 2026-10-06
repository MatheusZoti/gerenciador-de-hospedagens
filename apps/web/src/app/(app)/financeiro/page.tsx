import { Wallet } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Financeiro" };

export default function FinanceiroPage() {
  return (
    <ComingSoon
      title="Financeiro"
      description="Faturamento, recebimentos e contas a receber de cada reserva e imóvel."
      phase="Fase 3"
      icon={Wallet}
      features={[
        "Lançamentos de sinal e saldo gerados a partir das reservas",
        "Recebidos e a receber, com vencimentos e atrasos",
        "Despesas por imóvel (limpeza, manutenção, taxas, repasses)",
        "Resumo financeiro real no dashboard",
        "Cobrança por Pix com baixa automática via gateway de pagamento",
      ]}
    />
  );
}
