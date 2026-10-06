"use server";

import {
  createStage,
  deleteStage,
  moveStage,
  type StageColor,
  saveMessageTemplate,
  updateOrganizationSettings,
  updateStage,
} from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import { revalidatePath } from "next/cache";
import { type ActionState, toActionError } from "@/lib/actions";
import { requiredText, text } from "@/lib/form";
import { requireAppSession } from "@/lib/session";

/** O funil aparece em várias telas; tudo que depende dele é revalidado. */
function revalidatePipelineViews() {
  revalidatePath("/configuracoes/funil");
  revalidatePath("/configuracoes/mensagens");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  revalidatePath("/leads", "layout");
}

export async function updateOrganizationAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { ctx } = await requireAppSession();
  try {
    await updateOrganizationSettings(getDb(), ctx, {
      name: requiredText(form, "name"),
      timeZone: requiredText(form, "timeZone"),
    });
  } catch (error) {
    return toActionError(error);
  }
  // Nome e fuso aparecem no layout (menu lateral) e em todas as telas.
  revalidatePath("/", "layout");
  return { status: "success", message: "Organização atualizada." };
}

export async function createStageAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { ctx } = await requireAppSession();
  try {
    await createStage(getDb(), ctx, {
      name: requiredText(form, "name"),
      color: requiredText(form, "color") as StageColor,
    });
  } catch (error) {
    return toActionError(error);
  }
  revalidatePipelineViews();
  return { status: "success", message: "Etapa criada." };
}

export async function updateStageAction(
  stageId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { ctx } = await requireAppSession();
  try {
    await updateStage(getDb(), ctx, stageId, {
      name: requiredText(form, "name"),
      color: requiredText(form, "color") as StageColor,
    });
  } catch (error) {
    return toActionError(error);
  }
  revalidatePipelineViews();
  return { status: "success", message: "Etapa atualizada." };
}

export async function moveStageAction(stageId: string, direction: "up" | "down"): Promise<void> {
  const { ctx } = await requireAppSession();
  await moveStage(getDb(), ctx, stageId, direction);
  revalidatePipelineViews();
}

export async function deleteStageAction(
  stageId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { ctx } = await requireAppSession();
  let movedLeads = 0;
  try {
    ({ movedLeads } = await deleteStage(getDb(), ctx, stageId, {
      moveLeadsTo: text(form, "moveLeadsTo"),
    }));
  } catch (error) {
    return toActionError(error);
  }
  revalidatePipelineViews();
  return {
    status: "success",
    message:
      movedLeads > 0
        ? `Etapa excluída. ${movedLeads} ${movedLeads === 1 ? "lead movido" : "leads movidos"}.`
        : "Etapa excluída.",
  };
}

export async function saveTemplateAction(
  stageId: string | null,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { ctx } = await requireAppSession();
  const body = requiredText(form, "body");
  try {
    await saveMessageTemplate(getDb(), ctx, { stageId, body });
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/configuracoes/mensagens");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  revalidatePath("/leads", "layout");
  return {
    status: "success",
    message: !body && stageId ? "Esta etapa voltou a usar o modelo padrão." : "Modelo salvo.",
  };
}
