import { getFunnelSummary, STAGE_COLOR_LABEL, STAGE_COLORS } from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireAppSession } from "@/lib/session";
import {
  createStageAction,
  deleteStageAction,
  moveStageAction,
  updateStageAction,
} from "@/modules/settings/actions";
import { BackToSettings } from "@/modules/settings/components/back-to-settings";
import { NewStageForm } from "@/modules/settings/components/new-stage-form";
import { ReadOnlyNotice } from "@/modules/settings/components/read-only-notice";
import { StageRow } from "@/modules/settings/components/stage-row";

export const metadata: Metadata = { title: "Funil de vendas" };

const COLOR_OPTIONS = STAGE_COLORS.map((value) => ({ value, label: STAGE_COLOR_LABEL[value] }));

export default async function FunilPage() {
  const { ctx, canManage } = await requireAppSession();
  const stages = await getFunnelSummary(getDb(), ctx);
  const openIds = stages.filter((stage) => stage.kind === "open").map((stage) => stage.id);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <BackToSettings />
      <PageHeader
        title="Funil de vendas"
        description="As etapas viram as colunas do Kanban, nesta ordem. Renomeie, reordene ou crie etapas."
      />
      {canManage ? null : <ReadOnlyNotice />}
      <ol className="flex flex-col gap-3">
        {stages.map((stage) => {
          const openIndex = openIds.indexOf(stage.id);
          return (
            <StageRow
              key={stage.id}
              stage={stage}
              colors={COLOR_OPTIONS}
              destinations={stages
                .filter((other) => other.id !== stage.id)
                .map((other) => ({ value: other.id, label: other.name }))}
              canManage={canManage}
              canMoveUp={openIndex > 0}
              canMoveDown={openIndex >= 0 && openIndex < openIds.length - 1}
              updateAction={updateStageAction.bind(null, stage.id)}
              moveUpAction={moveStageAction.bind(null, stage.id, "up")}
              moveDownAction={moveStageAction.bind(null, stage.id, "down")}
              deleteAction={deleteStageAction.bind(null, stage.id)}
            />
          );
        })}
      </ol>
      {canManage ? <NewStageForm action={createStageAction} colors={COLOR_OPTIONS} /> : null}
    </div>
  );
}
