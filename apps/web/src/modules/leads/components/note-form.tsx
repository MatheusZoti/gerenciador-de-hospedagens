"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { FormAlert } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ActionState, idleState } from "@/lib/action-state";

export function NoteForm({
  action,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
}) {
  const [state, dispatch, pending] = useActionState(action, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => dispatch(form));
  }

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
        aria-invalid={state.fieldErrors?.text ? true : undefined}
      />
      <FormAlert message={state.status === "error" ? state.message : undefined} />
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="self-end">
        {pending ? "Salvando…" : "Adicionar nota"}
      </Button>
    </form>
  );
}
