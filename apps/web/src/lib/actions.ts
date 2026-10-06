import "server-only";
import { DomainError } from "@hospedagens/core";
import { ZodError } from "zod";
import type { ActionState } from "./action-state";

export type { ActionState } from "./action-state";

/**
 * Converte erros esperados (validação e regras de negócio) em mensagens para
 * o usuário. Erros inesperados sobem para o error boundary do Next.
 */
export function toActionError(error: unknown): ActionState {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Confira os campos destacados.", fieldErrors };
  }
  if (error instanceof DomainError) {
    return { status: "error", message: error.message };
  }
  throw error;
}
