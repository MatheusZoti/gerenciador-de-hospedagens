import { Lock } from "lucide-react";

export function ReadOnlyNotice() {
  return (
    <p className="flex items-center gap-2 rounded-lg border bg-muted/60 px-3 py-2 text-muted-foreground text-sm">
      <Lock className="size-4 shrink-0" aria-hidden />
      Só administradores podem alterar estas configurações.
    </p>
  );
}
