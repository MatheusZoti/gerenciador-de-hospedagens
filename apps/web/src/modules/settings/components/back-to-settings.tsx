import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function BackToSettings() {
  return (
    <Link
      href="/configuracoes"
      className="inline-flex items-center gap-1.5 self-start text-muted-foreground text-sm hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden /> Configurações
    </Link>
  );
}
