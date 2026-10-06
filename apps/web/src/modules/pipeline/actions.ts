"use server";

import { type MoveLeadInput, moveLead } from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import { revalidatePath } from "next/cache";
import { type ActionState, toActionError } from "@/lib/actions";
import { requireAppSession } from "@/lib/session";

export async function moveLeadAction(input: MoveLeadInput): Promise<ActionState> {
  const { ctx } = await requireAppSession();
  try {
    await moveLead(getDb(), ctx, input);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath(`/leads/${input.leadId}`);
  return { status: "success" };
}
