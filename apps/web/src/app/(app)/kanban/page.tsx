import { listLeadsByStage } from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireAppSession } from "@/lib/session";
import { KanbanBoard } from "@/modules/pipeline/components/kanban-board";

export const metadata: Metadata = { title: "Kanban" };

export default async function KanbanPage() {
  const { ctx } = await requireAppSession();
  const columns = await listLeadsByStage(getDb(), ctx);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kanban"
        description="Todas as etapas do funil. Arrastar cards entre etapas chega na fase 1."
      />
      <KanbanBoard columns={columns} variant="full" />
    </div>
  );
}
