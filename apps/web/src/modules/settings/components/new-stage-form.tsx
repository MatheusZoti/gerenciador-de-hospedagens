"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { FormAlert, FormField, fieldProps } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { ActionState } from "@/lib/action-state";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/utils";
import { stageDotClass } from "@/modules/pipeline/stage-colors";

export function NewStageForm({
  action,
  colors,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  colors: { value: string; label: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [color, setColor] = useState(colors[0]?.value ?? "slate");
  const { onSubmit, pending, errors, formError } = useFormAction(action, {
    onSuccess: () => formRef.current?.reset(),
  });

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      aria-label="Nova etapa"
      className="flex flex-col gap-3 rounded-xl border border-dashed bg-card/60 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormField
          label="Nova etapa"
          htmlFor="new-stage-name"
          error={errors.name}
          className="flex-1"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={cn("size-3 shrink-0 rounded-full", stageDotClass(color))}
              aria-hidden
            />
            <Input
              {...fieldProps("new-stage-name", errors.name)}
              name="name"
              placeholder="Ex.: Visita agendada"
              required
            />
          </div>
        </FormField>
        <FormField label="Cor" htmlFor="new-stage-color" className="sm:w-40">
          <NativeSelect
            id="new-stage-color"
            name="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          >
            {colors.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <Button type="submit" disabled={pending}>
          <Plus aria-hidden /> {pending ? "Criando…" : "Adicionar"}
        </Button>
      </div>
      <FormAlert message={formError} />
      <p className="text-muted-foreground text-xs">
        Etapas novas entram antes de “Fechado” e “Perdido”, que são sempre as últimas.
      </p>
    </form>
  );
}
