"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { FormAlert } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { ActionState } from "@/lib/action-state";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/utils";
import { stageDotClass } from "@/modules/pipeline/stage-colors";
import { DeleteStageDialog } from "./delete-stage-dialog";

export interface StageRowData {
  id: string;
  name: string;
  color: string;
  kind: "open" | "won" | "lost";
  leadCount: number;
}

interface Option {
  value: string;
  label: string;
}

const FINAL_LABEL = { won: "Etapa final: ganho", lost: "Etapa final: perdido" } as const;

export function StageRow({
  stage,
  colors,
  destinations,
  canManage,
  canMoveUp,
  canMoveDown,
  updateAction,
  moveUpAction,
  moveDownAction,
  deleteAction,
}: {
  stage: StageRowData;
  colors: Option[];
  destinations: Option[];
  canManage: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  updateAction: (state: ActionState, form: FormData) => Promise<ActionState>;
  moveUpAction: () => Promise<void>;
  moveDownAction: () => Promise<void>;
  deleteAction: (state: ActionState, form: FormData) => Promise<ActionState>;
}) {
  const [color, setColor] = useState(stage.color);
  const { onSubmit, pending, errors, formError } = useFormAction(updateAction);
  const nameId = `stage-${stage.id}-name`;
  const colorId = `stage-${stage.id}-color`;

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <form
          onSubmit={onSubmit}
          aria-label={`Editar etapa ${stage.name}`}
          className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end"
        >
          <fieldset disabled={!canManage} className="contents">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor={nameId}>Nome</Label>
              <div className="flex items-center gap-2.5">
                <span
                  className={cn("size-3 shrink-0 rounded-full", stageDotClass(color))}
                  aria-hidden
                />
                <Input
                  id={nameId}
                  name="name"
                  defaultValue={stage.name}
                  required
                  aria-invalid={errors.name ? true : undefined}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:w-40">
              <Label htmlFor={colorId}>Cor</Label>
              <NativeSelect
                id={colorId}
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
            </div>
            {canManage ? (
              <Button type="submit" variant="outline" disabled={pending}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
            ) : null}
          </fieldset>
        </form>

        {canManage && stage.kind === "open" ? (
          <div className="flex items-center gap-1 lg:pb-0.5">
            <form action={moveUpAction}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={!canMoveUp}
                aria-label={`Subir ${stage.name}`}
              >
                <ArrowUp aria-hidden />
              </Button>
            </form>
            <form action={moveDownAction}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={!canMoveDown}
                aria-label={`Descer ${stage.name}`}
              >
                <ArrowDown aria-hidden />
              </Button>
            </form>
            <DeleteStageDialog
              stageName={stage.name}
              leadCount={stage.leadCount}
              destinations={destinations}
              action={deleteAction}
            />
          </div>
        ) : null}
      </div>

      <FormAlert message={formError} />
      <p className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
        <span className="tabular-nums">
          {stage.leadCount} {stage.leadCount === 1 ? "lead" : "leads"}
        </span>
        {stage.kind !== "open" ? (
          <Badge variant="secondary">{FINAL_LABEL[stage.kind]}</Badge>
        ) : null}
      </p>
    </li>
  );
}
