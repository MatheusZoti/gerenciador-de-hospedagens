"use client";

import { FormAlert, FormField, fieldProps } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/action-state";
import { useFormAction } from "@/lib/use-form-action";

export function ProfileForm({
  action,
  defaults,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  defaults: { name: string; jobTitle: string };
}) {
  const { onSubmit, pending, errors, formError } = useFormAction(action);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormAlert message={formError} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome" htmlFor="name" error={errors.name}>
          <Input
            {...fieldProps("name", errors.name)}
            defaultValue={defaults.name}
            autoComplete="name"
            required
          />
        </FormField>
        <FormField
          label="Cargo"
          htmlFor="jobTitle"
          error={errors.jobTitle}
          hint="Aparece no menu lateral"
        >
          <Input
            {...fieldProps("jobTitle", errors.jobTitle, "Aparece no menu lateral")}
            defaultValue={defaults.jobTitle}
            placeholder="Ex.: Proprietário(a), Atendimento"
            autoComplete="organization-title"
          />
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar perfil"}
        </Button>
      </div>
    </form>
  );
}
