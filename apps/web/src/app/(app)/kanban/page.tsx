import { getMessageTemplates, listLeadsByStage } from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireAppSession } from "@/lib/session";
import { KanbanBoard } from "@/modules/pipeline/components/kanban-board";
import { toKanbanColumns } from "@/modules/pipeline/kanban-data";

export const metadata: Metadata = { title: "Kanban" };

export default async function KanbanPage() {
  const { ctx, organization } = await requireAppSession();
  const db = getDb();
  const [board, templates] = await Promise.all([
    listLeadsByStage(db, ctx),
    getMessageTemplates(db, ctx),
  ]);
  const columns = toKanbanColumns(board, {
    timeZone: organization.timeZone,
    templates,
    organizationName: organization.name,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kanban"
        description="Arraste os cards entre as etapas. No teclado: foque um card, espaço para pegar, setas para mover."
        actions={
          <Button asChild>
            <Link href="/leads/novo">
              <Plus aria-hidden /> Novo lead
            </Link>
          </Button>
        }
      />
      <KanbanBoard columns={columns} />
    </div>
  );
}
