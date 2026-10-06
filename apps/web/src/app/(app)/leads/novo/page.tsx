import { listProperties, listStages } from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAppSession } from "@/lib/session";
import { createLeadAction } from "@/modules/leads/actions";
import { LeadForm } from "@/modules/leads/components/lead-form";
import { SOURCE_OPTIONS } from "@/modules/leads/labels";

export const metadata: Metadata = { title: "Novo lead" };

export default async function NewLeadPage() {
  const { ctx } = await requireAppSession();
  const db = getDb();
  const [stages, properties] = await Promise.all([
    listStages(db, ctx),
    listProperties(db, ctx, { activeOnly: true }),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Leads
      </Link>
      <PageHeader
        title="Novo lead"
        description="Só o nome é obrigatório; complete o resto depois."
      />
      <Card>
        <CardContent>
          <LeadForm
            action={createLeadAction}
            stages={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
            properties={properties.map((item) => ({ value: item.id, label: item.name }))}
            sources={SOURCE_OPTIONS}
            submitLabel="Criar lead"
          />
        </CardContent>
      </Card>
    </div>
  );
}
