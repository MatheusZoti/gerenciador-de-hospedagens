import {
  getLead,
  getMessageTemplates,
  listLeadActivities,
  listProperties,
  listStages,
  NotFoundError,
} from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import { ArrowLeft, MessageCircle, MessageSquarePlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMessageTime, formatPhone } from "@/lib/format";
import { requireAppSession } from "@/lib/session";
import {
  addLeadNoteAction,
  deleteLeadAction,
  logLeadMessageAction,
  updateLeadAction,
} from "@/modules/leads/actions";
import { DeleteLeadDialog } from "@/modules/leads/components/delete-lead-dialog";
import { LeadForm } from "@/modules/leads/components/lead-form";
import { LeadTimeline } from "@/modules/leads/components/lead-timeline";
import { NoteForm } from "@/modules/leads/components/note-form";
import { SOURCE_LABEL, SOURCE_OPTIONS } from "@/modules/leads/labels";
import { StageLabel } from "@/modules/pipeline/components/stage-label";
import { whatsappLinkFor } from "@/modules/pipeline/kanban-data";

export const metadata: Metadata = { title: "Lead" };

export default async function LeadPage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const { ctx, organization } = await requireAppSession();
  const db = getDb();

  const lead = await getLead(db, ctx, id).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const [activities, stages, properties, templates] = await Promise.all([
    listLeadActivities(db, ctx, id),
    listStages(db, ctx),
    listProperties(db, ctx),
    getMessageTemplates(db, ctx),
  ]);

  const { timeZone } = organization;
  const whatsappUrl = whatsappLinkFor(lead, { templates, organizationName: organization.name });
  // Imóveis inativos só aparecem se já forem o interesse deste lead.
  const propertyOptions = properties
    .filter((item) => item.isActive || item.id === lead.propertyOfInterestId)
    .map((item) => ({
      value: item.id,
      label: item.isActive ? item.name : `${item.name} (inativo)`,
    }));

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 self-start text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Leads
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-semibold text-2xl text-foreground tracking-tight">{lead.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-muted-foreground text-sm">
            <StageLabel name={lead.stageName} color={lead.stageColor} className="text-foreground" />
            <Badge variant="outline">{SOURCE_LABEL[lead.source]}</Badge>
            <span className="tabular-nums">{formatPhone(lead.phone) ?? "Sem telefone"}</span>
            <span>
              Última mensagem:{" "}
              <span className="tabular-nums">
                {lead.lastMessageAt ? formatMessageTime(lead.lastMessageAt, { timeZone }) : "—"}
              </span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {whatsappUrl ? (
            <Button asChild variant="whatsapp" size="sm">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden /> Abrir no WhatsApp
              </a>
            </Button>
          ) : null}
          <form action={logLeadMessageAction.bind(null, lead.id)}>
            <Button type="submit" variant="outline" size="sm">
              <MessageSquarePlus aria-hidden /> Registrar conversa agora
            </Button>
          </form>
          <DeleteLeadDialog leadName={lead.name} action={deleteLeadAction.bind(null, lead.id)} />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Dados do lead</CardTitle>
            <CardDescription>
              Mudar a etapa aqui leva o lead para o topo da coluna no Kanban.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadForm
              action={updateLeadAction.bind(null, lead.id)}
              defaults={{
                name: lead.name,
                phone: formatPhone(lead.phone) ?? "",
                email: lead.email ?? "",
                source: lead.source,
                propertyOfInterestId: lead.propertyOfInterestId ?? "",
                stageId: lead.stageId,
                desiredCheckIn: lead.desiredCheckIn ?? "",
                desiredCheckOut: lead.desiredCheckOut ?? "",
                guests: lead.guests?.toString() ?? "",
                birthday: lead.birthday ?? "",
                notes: lead.notes ?? "",
                lostReason: lead.lostReason ?? "",
              }}
              stages={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
              properties={propertyOptions}
              sources={SOURCE_OPTIONS}
              submitLabel="Salvar alterações"
              showLostReason={lead.stageKind === "lost"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linha do tempo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <NoteForm action={addLeadNoteAction.bind(null, lead.id)} />
            <LeadTimeline activities={activities} timeZone={timeZone} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
