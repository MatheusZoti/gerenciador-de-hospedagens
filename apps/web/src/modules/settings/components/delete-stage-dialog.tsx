"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormAlert, FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { type ActionState, idleState } from "@/lib/action-state";

export function DeleteStageDialog({
  stageName,
  leadCount,
  destinations,
  action,
}: {
  stageName: string;
  leadCount: number;
  destinations: { value: string; label: string }[];
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
}) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();

  // Sem useActionState: ao excluir, esta linha some da tela junto com o
  // diálogo, então o aviso é disparado aqui, logo após a resposta.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await action(idleState, form);
      if (result.status === "error") {
        setFormError(result.message);
        return;
      }
      if (result.message) toast.success(result.message);
      setOpen(false);
    });
  }
  const selectId = `move-${stageName}`.replace(/\s+/g, "-");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          aria-label={`Excluir ${stageName}`}
        >
          <Trash2 aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Excluir a etapa “{stageName}”?</DialogTitle>
        <DialogDescription>
          {leadCount > 0
            ? `Ela tem ${leadCount} ${leadCount === 1 ? "lead" : "leads"}. Escolha para onde ${leadCount === 1 ? "ele vai" : "eles vão"}; a mudança fica registrada na linha do tempo.`
            : "A etapa está vazia. O modelo de mensagem dela também será removido."}
        </DialogDescription>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {leadCount > 0 ? (
            <FormField label="Mover os leads para" htmlFor={selectId}>
              <NativeSelect id={selectId} name="moveLeadsTo" required defaultValue="">
                <option value="" disabled>
                  Escolha uma etapa
                </option>
                {destinations.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          ) : null}
          <FormAlert message={formError} />
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending ? "Excluindo…" : "Excluir etapa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
