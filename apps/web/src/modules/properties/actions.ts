"use server";

import {
  createProperty,
  parseMoneyToCents,
  setPropertyActive,
  updateProperty,
} from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, toActionError } from "@/lib/actions";
import { integer, requiredText, text } from "@/lib/form";
import { requireAppSession } from "@/lib/session";

function propertyInputFromForm(form: FormData) {
  return {
    name: requiredText(form, "name"),
    address: text(form, "address"),
    city: text(form, "city"),
    maxGuests: integer(form, "maxGuests"),
    bedrooms: integer(form, "bedrooms"),
    basePriceCents: parseMoneyToCents(text(form, "basePrice")),
  };
}

function revalidatePropertyViews() {
  revalidatePath("/configuracoes/imoveis");
  revalidatePath("/leads");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
}

export async function createPropertyAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { ctx } = await requireAppSession();
  try {
    await createProperty(getDb(), ctx, propertyInputFromForm(form));
  } catch (error) {
    return toActionError(error);
  }
  revalidatePropertyViews();
  redirect("/configuracoes/imoveis");
}

export async function updatePropertyAction(
  propertyId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { ctx } = await requireAppSession();
  try {
    await updateProperty(getDb(), ctx, propertyId, propertyInputFromForm(form));
  } catch (error) {
    return toActionError(error);
  }
  revalidatePropertyViews();
  return { status: "success", message: "Imóvel atualizado." };
}

export async function setPropertyActiveAction(propertyId: string, isActive: boolean) {
  const { ctx } = await requireAppSession();
  await setPropertyActive(getDb(), ctx, propertyId, isActive);
  revalidatePropertyViews();
  revalidatePath(`/configuracoes/imoveis/${propertyId}`);
}
