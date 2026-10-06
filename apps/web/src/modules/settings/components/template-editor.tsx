"use client";

import {
  renderTemplate,
  TEMPLATE_EXAMPLE_VALUES,
  TEMPLATE_MAX_LENGTH,
  TEMPLATE_VARIABLES,
  unknownTemplateVariables,
} from "@hospedagens/core/templates";
import { MessageCircle } from "lucide-react";
import { useRef, useState } from "react";
import { FormAlert } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/action-state";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/utils";
import { stageDotClass } from "@/modules/pipeline/stage-colors";

/**
 * Editor de um modelo de mensagem. A pré-visualização usa `renderTemplate`
 * de `@hospedagens/core/templates` (módulo puro, seguro no navegador).
 */
export function TemplateEditor({
  id,
  title,
  stageColor,
  description,
  initialBody,
  fallbackBody,
  canManage,
  organizationName,
  action,
}: {
  id: string;
  /** Nome real da organização para a variável {organizacao} na pré-visualização. */
  organizationName: string;
  title: string;
  stageColor?: string;
  description?: string;
  initialBody: string;
  /** Para etapas: modelo usado quando o campo fica vazio (o padrão). */
  fallbackBody?: string;
  canManage: boolean;
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
}) {
  const [body, setBody] = useState(initialBody);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { onSubmit, pending, formError } = useFormAction(action);

  const usingFallback = fallbackBody !== undefined && body.trim() === "";
  const preview = renderTemplate(usingFallback ? fallbackBody : body, {
    ...TEMPLATE_EXAMPLE_VALUES,
    organizacao: organizationName,
  });
  const unknown = unknownTemplateVariables(body);
  const fieldId = `template-${id}`;

  function insertVariable(key: string) {
    const textarea = textareaRef.current;
    const token = `{${key}}`;
    if (!textarea) {
      setBody((current) => current + token);
      return;
    }
    const start = textarea.selectionStart ?? body.length;
    const end = textarea.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function resetToDefault() {
    setBody("");
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  return (
    <section
      aria-labelledby={`${fieldId}-title`}
      className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs sm:p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`${fieldId}-title`} className="flex items-center gap-2 font-medium text-foreground">
          {stageColor ? (
            <span className={cn("size-2.5 rounded-full", stageDotClass(stageColor))} aria-hidden />
          ) : null}
          {title}
        </h2>
        {usingFallback ? <Badge variant="secondary">Usando o modelo padrão</Badge> : null}
      </header>
      {description ? <p className="-mt-2 text-muted-foreground text-sm">{description}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3">
          <Label htmlFor={fieldId} className="sr-only">
            Texto do modelo {title}
          </Label>
          <Textarea
            ref={textareaRef}
            id={fieldId}
            name="body"
            rows={5}
            maxLength={TEMPLATE_MAX_LENGTH}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={!canManage}
            placeholder={fallbackBody ? "Vazio: usa o modelo padrão" : undefined}
            aria-invalid={unknown.length > 0 || formError ? true : undefined}
          />
          {canManage ? (
            <fieldset className="flex flex-wrap gap-1.5">
              <legend className="sr-only">Inserir variável</legend>
              {TEMPLATE_VARIABLES.map((variable) => (
                <Button
                  key={variable.key}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => insertVariable(variable.key)}
                  title={`Insere ${variable.label.toLowerCase()} (ex.: ${variable.example})`}
                >
                  {`{${variable.key}}`}
                </Button>
              ))}
            </fieldset>
          ) : null}
          {unknown.length > 0 ? (
            <p className="text-destructive text-xs">
              Variável desconhecida: {unknown.map((key) => `{${key}}`).join(", ")}
            </p>
          ) : null}
          <FormAlert message={formError} />
          {canManage ? (
            <div className="flex flex-wrap justify-end gap-2">
              {fallbackBody !== undefined && initialBody !== "" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetToDefault}
                  disabled={pending}
                >
                  Usar o modelo padrão
                </Button>
              ) : null}
              <Button type="submit" size="sm" disabled={pending || unknown.length > 0}>
                {pending ? "Salvando…" : "Salvar modelo"}
              </Button>
            </div>
          ) : null}
        </form>

        <figure className="flex flex-col gap-2">
          <figcaption className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <MessageCircle className="size-3.5" aria-hidden />
            Pré-visualização com um lead de exemplo
          </figcaption>
          <div className="rounded-lg bg-emerald-50 p-3">
            <p
              className="ml-auto w-fit max-w-full whitespace-pre-wrap rounded-lg rounded-tr-none bg-white px-3 py-2 text-foreground text-sm shadow-xs"
              data-testid={`${fieldId}-preview`}
            >
              {preview || "—"}
            </p>
          </div>
        </figure>
      </div>
    </section>
  );
}
