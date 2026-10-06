"use client";

import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";
import { FormAlert, FormField, fieldProps } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ActionState, idleState } from "@/lib/action-state";

export interface PropertyFormValues {
  name: string;
  address: string;
  city: string;
  maxGuests: string;
  bedrooms: string;
  basePrice: string;
}

export function PropertyForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  defaults?: Partial<PropertyFormValues>;
  submitLabel: string;
}) {
  const [state, dispatch, pending] = useActionState(action, idleState);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => dispatch(form));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormAlert message={state.status === "error" ? state.message : undefined} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nome do imóvel"
          htmlFor="name"
          error={errors.name}
          className="sm:col-span-2"
        >
          <Input {...fieldProps("name", errors.name)} defaultValue={defaults.name} required />
        </FormField>
        <FormField label="Endereço" htmlFor="address" error={errors.address}>
          <Input {...fieldProps("address", errors.address)} defaultValue={defaults.address} />
        </FormField>
        <FormField label="Cidade" htmlFor="city" error={errors.city}>
          <Input {...fieldProps("city", errors.city)} defaultValue={defaults.city} />
        </FormField>
        <FormField label="Hóspedes (máximo)" htmlFor="maxGuests" error={errors.maxGuests}>
          <Input
            {...fieldProps("maxGuests", errors.maxGuests)}
            defaultValue={defaults.maxGuests}
            type="number"
            min={1}
            inputMode="numeric"
          />
        </FormField>
        <FormField label="Quartos" htmlFor="bedrooms" error={errors.bedrooms}>
          <Input
            {...fieldProps("bedrooms", errors.bedrooms)}
            defaultValue={defaults.bedrooms}
            type="number"
            min={0}
            inputMode="numeric"
          />
        </FormField>
        <FormField
          label="Diária base (R$)"
          htmlFor="basePrice"
          error={errors.basePriceCents}
          hint="Ex.: 650,00"
        >
          <Input
            {...fieldProps("basePrice", errors.basePriceCents, "Ex.: 650,00")}
            defaultValue={defaults.basePrice}
            inputMode="decimal"
            placeholder="0,00"
          />
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
