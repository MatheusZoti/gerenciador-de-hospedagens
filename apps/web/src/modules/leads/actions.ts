"use server";

import {
  addLeadNote,
  type CreateLeadInput,
  createLead,
  deleteLead,
  logLeadMessage,
  updateLead,
} from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, toActionError } from "@/lib/actions";
import { integer, requiredText, text } from "@/lib/form";
import { requireAppSession } from "@/lib/session";

function leadInputFromForm(form: FormData) {
  return {
    name: requiredText(form, "name"),
    phone: text(form, "phone"),
    email: text(form, "email"),
    source: (text(form, "source") ?? undefined) as CreateLeadInput["source"],
    propertyOfInterestId: text(form, "propertyOfInterestId"),
    stageId: text(form, "stageId") ?? undefined,
    desiredCheckIn: text(form, "desiredCheckIn"),
    desiredCheckOut: text(form, "desiredCheckOut"),
    guests: integer(form, "guests"),
    birthday: text(form, "birthday"),
    notes: text(form, "notes"),
    lostReason: text(form, "lostReason"),
  };
}

function revalidateLeadViews(leadId?: string) {
  revalidatePath("/leads");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function createLeadAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { ctx } = await requireAppSession();
  let leadId: string;
  try {
    ({ id: leadId } = await createLead(getDb(), ctx, leadInputFromForm(form)));
  } catch (error) {
    return toActionError(error);
  }
  revalidateLeadViews();
  redirect(`/leads/${leadId}` as Route);
}

export async function updateLeadAction(
  leadId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { ctx } = await requireAppSession();
  try {
    await updateLead(getDb(), ctx, leadId, leadInputFromForm(form));
  } catch (error) {
    return toActionError(error);
  }
  revalidateLeadViews(leadId);
  return { status: "success", message: "Lead atualizado." };
}

export async function addLeadNoteAction(
  leadId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { ctx } = await requireAppSession();
  try {
    await addLeadNote(getDb(), ctx, leadId, { text: requiredText(form, "text") });
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath(`/leads/${leadId}`);
  return { status: "success" };
}

export async function logLeadMessageAction(leadId: string): Promise<void> {
  const { ctx } = await requireAppSession();
  await logLeadMessage(getDb(), ctx, leadId);
  revalidateLeadViews(leadId);
}

export async function deleteLeadAction(leadId: string): Promise<void> {
  const { ctx } = await requireAppSession();
  await deleteLead(getDb(), ctx, leadId);
  revalidateLeadViews();
  redirect("/leads");
}
