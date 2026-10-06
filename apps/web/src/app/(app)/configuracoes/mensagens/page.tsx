import { getMessageTemplates, listStages, TEMPLATE_VARIABLES } from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireAppSession } from "@/lib/session";
import { saveTemplateAction } from "@/modules/settings/actions";
import { BackToSettings } from "@/modules/settings/components/back-to-settings";
import { ReadOnlyNotice } from "@/modules/settings/components/read-only-notice";
import { TemplateEditor } from "@/modules/settings/components/template-editor";

export const metadata: Metadata = { title: "Modelos de mensagem" };

export default async function MensagensPage() {
  const { ctx, canManage, organization } = await requireAppSession();
  const db = getDb();
  const [templates, stages] = await Promise.all([
    getMessageTemplates(db, ctx),
    listStages(db, ctx),
  ]);

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <BackToSettings />
      <PageHeader
        title="Modelos de mensagem"
        description="Texto que já vem escrito ao clicar em “Abrir no WhatsApp”, conforme a etapa do lead. Você pode editar antes de enviar."
      />
      {canManage ? null : <ReadOnlyNotice />}

      <dl className="grid gap-x-6 gap-y-1 rounded-xl border bg-card/60 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATE_VARIABLES.map((variable) => (
          <div key={variable.key} className="flex gap-2">
            <dt className="font-mono text-foreground text-xs leading-5">{`{${variable.key}}`}</dt>
            <dd className="text-muted-foreground">
              {variable.label}{" "}
              <span className="text-xs">
                (ex.: {variable.key === "organizacao" ? organization.name : variable.example})
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <TemplateEditor
        id="padrao"
        title="Modelo padrão"
        description="Usado nas etapas que não têm modelo próprio."
        initialBody={templates.defaultBody}
        canManage={canManage}
        organizationName={organization.name}
        action={saveTemplateAction.bind(null, null)}
      />
      {stages.map((stage) => (
        <TemplateEditor
          key={stage.id}
          id={stage.id}
          title={stage.name}
          stageColor={stage.color}
          initialBody={templates.byStage[stage.id] ?? ""}
          fallbackBody={templates.defaultBody}
          canManage={canManage}
          organizationName={organization.name}
          action={saveTemplateAction.bind(null, stage.id)}
        />
      ))}
    </div>
  );
}
