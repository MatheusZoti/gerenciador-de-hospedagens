"use client";

import { useRef } from "react";
import { FormAlert } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/action-state";
import { useFormAction } from "@/lib/use-form-action";

export function NoteForm({
  action,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { onSubmit, pending, errors, formError } = useFormAction(action, {
    onSuccess: () => formRef.current?.reset(),
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-2">
      <Label htmlFor="note-text" className="sr-only">
        Nova nota
      </Label>
      <Textarea
        id="note-text"
        name="text"
        rows={3}
        required
        placeholder="Escreva uma nota sobre a conversa..."
        aria-invalid={errors.text ? true : undefined}
      />
      <FormAlert message={formError} />
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="self-end">
        {pending ? "Salvando…" : "Adicionar nota"}
      </Button>
    </form>
  );
}
