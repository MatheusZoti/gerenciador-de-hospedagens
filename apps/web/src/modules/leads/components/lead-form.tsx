"use client";

import { FormAlert, FormField, fieldProps } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/action-state";
import { useFormAction } from "@/lib/use-form-action";

export interface LeadFormValues {
  name: string;
  phone: string;
  email: string;
  source: string;
  propertyOfInterestId: string;
  stageId: string;
  desiredCheckIn: string;
  desiredCheckOut: string;
  guests: string;
  birthday: string;
  notes: string;
  lostReason: string;
}

interface Option {
  value: string;
  label: string;
}

export function LeadForm({
  action,
  defaults = {},
  stages,
  properties,
  sources,
  submitLabel,
  showLostReason = false,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  defaults?: Partial<LeadFormValues>;
  stages: Option[];
  properties: Option[];
  sources: Option[];
  submitLabel: string;
  showLostReason?: boolean;
}) {
  const { onSubmit, pending, errors, formError } = useFormAction(action);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormAlert message={formError} />

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-medium text-foreground text-sm">Contato</legend>
        <FormField label="Nome" htmlFor="name" error={errors.name} className="sm:col-span-2">
          <Input
            {...fieldProps("name", errors.name)}
            defaultValue={defaults.name}
            required
            autoComplete="off"
          />
        </FormField>
        <FormField label="Telefone (WhatsApp)" htmlFor="phone" error={errors.phone} hint="Com DDD">
          <Input
            {...fieldProps("phone", errors.phone, "Com DDD")}
            defaultValue={defaults.phone}
            type="tel"
            inputMode="tel"
            placeholder="(11) 98765-4321"
          />
        </FormField>
        <FormField label="E-mail" htmlFor="email" error={errors.email}>
          <Input
            {...fieldProps("email", errors.email)}
            defaultValue={defaults.email}
            type="email"
          />
        </FormField>
        <FormField label="Origem" htmlFor="source" error={errors.source}>
          <NativeSelect
            {...fieldProps("source", errors.source)}
            defaultValue={defaults.source ?? "whatsapp"}
          >
            {sources.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-medium text-foreground text-sm">Interesse</legend>
        <FormField
          label="Imóvel de interesse"
          htmlFor="propertyOfInterestId"
          error={errors.propertyOfInterestId}
        >
          <NativeSelect
            {...fieldProps("propertyOfInterestId", errors.propertyOfInterestId)}
            defaultValue={defaults.propertyOfInterestId ?? ""}
          >
            <option value="">Não definido</option>
            {properties.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Etapa do funil" htmlFor="stageId" error={errors.stageId}>
          <NativeSelect
            {...fieldProps("stageId", errors.stageId)}
            defaultValue={defaults.stageId ?? stages[0]?.value}
          >
            {stages.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Check-in desejado" htmlFor="desiredCheckIn" error={errors.desiredCheckIn}>
          <Input
            {...fieldProps("desiredCheckIn", errors.desiredCheckIn)}
            defaultValue={defaults.desiredCheckIn}
            type="date"
          />
        </FormField>
        <FormField
          label="Check-out desejado"
          htmlFor="desiredCheckOut"
          error={errors.desiredCheckOut}
        >
          <Input
            {...fieldProps("desiredCheckOut", errors.desiredCheckOut)}
            defaultValue={defaults.desiredCheckOut}
            type="date"
          />
        </FormField>
        <FormField label="Hóspedes" htmlFor="guests" error={errors.guests}>
          <Input
            {...fieldProps("guests", errors.guests)}
            defaultValue={defaults.guests}
            type="number"
            min={1}
            max={100}
            inputMode="numeric"
          />
        </FormField>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-medium text-foreground text-sm">Relacionamento</legend>
        <FormField label="Aniversário" htmlFor="birthday" error={errors.birthday}>
          <Input
            {...fieldProps("birthday", errors.birthday)}
            defaultValue={defaults.birthday}
            type="date"
          />
        </FormField>
        {showLostReason ? (
          <FormField label="Motivo da perda" htmlFor="lostReason" error={errors.lostReason}>
            <Input
              {...fieldProps("lostReason", errors.lostReason)}
              defaultValue={defaults.lostReason}
            />
          </FormField>
        ) : null}
        <FormField
          label="Observações"
          htmlFor="notes"
          error={errors.notes}
          className="sm:col-span-2"
        >
          <Textarea
            {...fieldProps("notes", errors.notes)}
            defaultValue={defaults.notes}
            rows={4}
            placeholder="Preferências, pedidos especiais, como conheceu..."
          />
        </FormField>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
