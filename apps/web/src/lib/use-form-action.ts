"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { type ActionState, idleState } from "./action-state";

/**
 * Liga um formulário a uma Server Action que devolve `ActionState`.
 * Usa `onSubmit` + `startTransition` (e não `<form action>`) para o React não
 * limpar os campos quando a validação falha no servidor.
 */
export function useFormAction(
  action: (state: ActionState, form: FormData) => Promise<ActionState>,
  options: { onSuccess?: (state: ActionState) => void; toastOnSuccess?: boolean } = {},
) {
  const [state, dispatch, pending] = useActionState(action, idleState);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (state.status !== "success") return;
    const { onSuccess, toastOnSuccess = true } = optionsRef.current;
    if (toastOnSuccess && state.message) toast.success(state.message);
    onSuccess?.(state);
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => dispatch(form));
  }

  return {
    state,
    pending,
    onSubmit,
    errors: state.fieldErrors ?? {},
    formError: state.status === "error" ? state.message : undefined,
  };
}
