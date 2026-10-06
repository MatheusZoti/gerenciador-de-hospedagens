import { SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card/60 px-6 py-16 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="font-semibold text-foreground text-lg">Não encontrado</h1>
      <p className="max-w-sm text-muted-foreground text-sm">
        Esse registro não existe ou foi excluído.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Voltar ao dashboard</Link>
      </Button>
    </div>
  );
}
