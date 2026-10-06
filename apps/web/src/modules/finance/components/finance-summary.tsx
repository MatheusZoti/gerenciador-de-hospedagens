import { ArrowDownToLine, CircleDollarSign, Hourglass } from "lucide-react";

const TILES = [
  { label: "Faturamento do mês", hint: "Receitas com competência no mês", icon: CircleDollarSign },
  { label: "Recebidos", hint: "Pagamentos confirmados no mês", icon: ArrowDownToLine },
  { label: "A receber", hint: "Receitas pendentes ou vencidas", icon: Hourglass },
] as const;

/**
 * Resumo financeiro do dashboard. Os valores reais chegam com o módulo
 * Financeiro (fase 3); por enquanto mostra o estado vazio.
 */
export function FinanceSummary() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {TILES.map((tile) => (
        <li
          key={tile.label}
          className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs"
        >
          <p className="flex items-center gap-2 text-muted-foreground text-sm">
            <tile.icon className="size-4" aria-hidden />
            {tile.label}
          </p>
          <p className="font-semibold text-3xl text-muted-foreground/60 tracking-tight">R$ —</p>
          <p className="text-muted-foreground text-xs">{tile.hint}</p>
        </li>
      ))}
    </ul>
  );
}
