"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-destructive text-white hover:bg-destructive/90"
    >
      {pending ? "Excluindo…" : "Excluir lead"}
    </Button>
  );
}

export function DeleteLeadDialog({
  leadName,
  action,
}: {
  leadName: string;
  action: () => Promise<void>;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 aria-hidden /> Excluir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Excluir {leadName}?</DialogTitle>
        <DialogDescription>
          O lead e toda a linha do tempo serão apagados. Para guardar o histórico, mova o lead para
          a etapa “Perdido” em vez de excluir.
        </DialogDescription>
        <form action={action} className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <ConfirmButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
