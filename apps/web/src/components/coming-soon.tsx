import { CircleDashed, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

/** Página de módulo ainda não implementado: descreve o que vem e em qual fase. */
export function ComingSoon({
  title,
  description,
  phase,
  icon: Icon,
  features,
}: {
  title: string;
  description: string;
  phase: string;
  icon: LucideIcon;
  features: string[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <section className="flex max-w-2xl flex-col gap-5 rounded-xl border border-dashed bg-card/60 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-foreground">Em construção</p>
            <Badge variant="soon" className="mt-1">
              {phase}
            </Badge>
          </div>
        </div>
        <div>
          <h2 className="font-medium text-foreground text-sm">O que este módulo vai fazer</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-muted-foreground text-sm">
                <CircleDashed className="mt-0.5 size-4 shrink-0 text-primary/70" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
