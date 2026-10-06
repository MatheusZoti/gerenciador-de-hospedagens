/**
 * Resultado padrão de Server Actions usadas com `useActionState`.
 * Arquivo sem dependências de servidor: pode ser importado por componentes cliente.
 */
export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  /** Primeiro erro de cada campo, pela chave do campo no formulário. */
  fieldErrors?: Record<string, string>;
}

export const idleState: ActionState = { status: "idle" };
