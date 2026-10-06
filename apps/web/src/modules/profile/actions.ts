"use server";

import {
  AVATAR_MAX_BYTES,
  avatarKey,
  type FileStorage,
  updateProfileSchema,
  validateAvatarUpload,
} from "@hospedagens/core";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { type ActionState, toActionError } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { requiredText, text } from "@/lib/form";
import { requireAppSession } from "@/lib/session";
import { getFileStorage } from "@/lib/storage/r2";

const STORAGE_DISABLED: ActionState = {
  status: "error",
  message: "Configure o Cloudflare R2 para enviar fotos (veja docs/setup/cloudflare-r2.md).",
};

export async function updateProfileAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAppSession();
  try {
    const data = updateProfileSchema.parse({
      name: requiredText(form, "name"),
      jobTitle: text(form, "jobTitle"),
    });
    await auth.api.updateUser({
      headers: await headers(),
      body: { name: data.name, jobTitle: data.jobTitle ?? "" },
    });
  } catch (error) {
    return toActionError(error);
  }
  // Nome e cargo aparecem no menu lateral de todas as telas.
  revalidatePath("/", "layout");
  return { status: "success", message: "Perfil atualizado." };
}

export async function uploadAvatarAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAppSession();
  const storage = getFileStorage();
  if (!storage) return STORAGE_DISABLED;

  const file = form.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Escolha uma imagem." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { status: "error", message: "A imagem deve ter no máximo 2 MB." };
  }

  let format: { contentType: string; extension: string };
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    format = validateAvatarUpload(bytes);
  } catch (error) {
    return toActionError(error);
  }

  let url: string;
  try {
    ({ url } = await storage.put({
      key: avatarKey(user.id, format.extension),
      body: bytes,
      contentType: format.contentType,
    }));
  } catch (error) {
    console.error("Falha ao enviar avatar para o storage", error);
    return { status: "error", message: "Não foi possível enviar a foto. Tente de novo." };
  }

  await auth.api.updateUser({ headers: await headers(), body: { image: url } });
  await deleteStoredAvatar(storage, user.image);
  revalidatePath("/", "layout");
  return { status: "success", message: "Foto atualizada." };
}

export async function removeAvatarAction(): Promise<ActionState> {
  const { user } = await requireAppSession();
  await auth.api.updateUser({ headers: await headers(), body: { image: null } });
  const storage = getFileStorage();
  if (storage) await deleteStoredAvatar(storage, user.image);
  revalidatePath("/", "layout");
  return { status: "success", message: "Foto removida." };
}

/** Apaga a foto anterior se ela estiver no nosso storage (falha não bloqueia). */
async function deleteStoredAvatar(storage: FileStorage, imageUrl: string | null | undefined) {
  const key = imageUrl ? storage.keyFromUrl(imageUrl) : null;
  if (!key) return;
  try {
    await storage.delete(key);
  } catch (error) {
    console.error("Falha ao apagar avatar antigo", error);
  }
}
