"use client";

import { ImageUp, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { FormAlert } from "@/components/form-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/action-state";
import { useFormAction } from "@/lib/use-form-action";
import { initials } from "@/lib/utils";

export function AvatarForm({
  name,
  image,
  storageEnabled,
  maxBytes,
  uploadAction,
  removeAction,
}: {
  name: string;
  image: string | null;
  storageEnabled: boolean;
  maxBytes: number;
  uploadAction: (state: ActionState, form: FormData) => Promise<ActionState>;
  removeAction: () => Promise<ActionState>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string>();
  const [removing, startRemove] = useTransition();
  const { onSubmit, pending, formError } = useFormAction(uploadAction, {
    onSuccess: () => {
      formRef.current?.reset();
      setPreview(null);
    },
  });

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setClientError(undefined);
    setPreview(null);
    if (!file) return;
    if (file.size > maxBytes) {
      setClientError("A imagem deve ter no máximo 2 MB.");
      event.target.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  function remove() {
    startRemove(async () => {
      const result = await removeAction();
      if (result.status === "success" && result.message) toast.success(result.message);
    });
  }

  const shown = preview ?? image;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex flex-col gap-4 sm:flex-row sm:items-center"
    >
      <Avatar className="size-20">
        {shown ? <AvatarImage src={shown} alt="" /> : null}
        <AvatarFallback className="text-xl">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Label htmlFor="avatar">Foto de perfil</Label>
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={!storageEnabled}
          onChange={onFileChange}
          aria-describedby="avatar-hint"
          className="block w-full text-muted-foreground text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-card file:px-3 file:py-1.5 file:font-medium file:text-foreground file:text-sm hover:file:bg-accent disabled:opacity-60"
        />
        <p id="avatar-hint" className="text-muted-foreground text-xs">
          {storageEnabled
            ? "JPG, PNG ou WebP, até 2 MB."
            : "Upload desativado: configure o Cloudflare R2 (docs/setup/cloudflare-r2.md)."}
        </p>
        <FormAlert message={clientError ?? formError} />
        {storageEnabled ? (
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={!preview || pending}>
              <ImageUp aria-hidden /> {pending ? "Enviando…" : "Enviar foto"}
            </Button>
            {image ? (
              <Button type="button" size="sm" variant="ghost" onClick={remove} disabled={removing}>
                <Trash2 aria-hidden /> {removing ? "Removendo…" : "Remover foto"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
