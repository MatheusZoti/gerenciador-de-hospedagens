import { getFunnelSummary, listLeadsByStage } from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { greeting, monthLabel } from "@/lib/format";
import { requireAppSession } from "@/lib/session";
import { FinanceSummary } from "@/modules/finance/components/finance-summary";
import { FunnelSummary } from "@/modules/pipeline/components/funnel-summary";
import { KanbanBoard } from "@/modules/pipeline/components/kanban-board";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { ctx, user } = await requireAppSession();
  const db = getDb();
  const [funnel, board] = await Promise.all([
    getFunnelSummary(db, ctx),
    listLeadsByStage(db, ctx, { kinds: ["open"], limitPerStage: 3 }),
  ]);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={`Resumo do funil de vendas e das finanças · ${monthLabel()}`}
      />

      <section aria-labelledby="funil" className="flex flex-col gap-4">
        <h2 id="funil" className="font-semibold text-foreground">
          Funil de vendas
        </h2>
        <FunnelSummary stages={funnel} />
      </section>

      <section aria-labelledby="kanban" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="kanban" className="font-semibold text-foreground">
            Kanban
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/kanban">
              Ver Kanban completo <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <KanbanBoard columns={board} variant="preview" />
      </section>

      <section aria-labelledby="financeiro" className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h2 id="financeiro" className="font-semibold text-foreground">
            Financeiro
          </h2>
          <Badge variant="soon">Fase 3</Badge>
        </div>
        <FinanceSummary />
      </section>
    </div>
  );
}
