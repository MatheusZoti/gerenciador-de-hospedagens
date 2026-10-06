"use client";

import { FormAlert, FormField, fieldProps } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { ActionState } from "@/lib/action-state";
import { useFormAction } from "@/lib/use-form-action";

export function OrganizationForm({
  action,
  defaults,
  timeZones,
  canManage,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  defaults: { name: string; timeZone: string };
  timeZones: { value: string; label: string }[];
  canManage: boolean;
}) {
  const { onSubmit, pending, errors, formError } = useFormAction(action);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormAlert message={formError} />
      <fieldset disabled={!canManage} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome da organização" htmlFor="name" error={errors.name}>
          <Input {...fieldProps("name", errors.name)} defaultValue={defaults.name} required />
        </FormField>
        <FormField
          label="Fuso horário"
          htmlFor="timeZone"
          error={errors.timeZone}
          hint="Usado nos horários de mensagens, no Kanban e nos relatórios"
        >
          <NativeSelect
            {...fieldProps(
              "timeZone",
              errors.timeZone,
              "Usado nos horários de mensagens, no Kanban e nos relatórios",
            )}
            defaultValue={defaults.timeZone}
          >
            {timeZones.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </fieldset>
      {canManage ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
