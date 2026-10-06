import type { FunnelStageSummary } from "@hospedagens/core";
import Link from "next/link";
import { StageLabel } from "./stage-label";

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  count === 1 ? singular : pluralForm;

/** Linha de indicadores: quantos leads há em cada etapa aberta do funil. */
export function FunnelSummary({ stages }: { stages: FunnelStageSummary[] }) {
  const open = stages.filter((stage) => stage.kind === "open");
  const won = stages.filter((stage) => stage.kind === "won");
  const lost = stages.filter((stage) => stage.kind === "lost");
  const sum = (list: FunnelStageSummary[]) => list.reduce((total, s) => total + s.leadCount, 0);
  const openTotal = sum(open);
  const wonTotal = sum(won);
  const lostTotal = sum(lost);

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {open.map((stage) => (
          <li key={stage.id}>
            <Link
              href="/kanban"
              className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs outline-none transition-colors hover:border-ring/40 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <StageLabel
                name={stage.name}
                color={stage.color}
                className="text-muted-foreground text-sm"
                wrap
              />
              <p className="flex items-baseline gap-1.5">
                <span className="font-semibold text-3xl text-foreground tabular-nums tracking-tight">
                  {stage.leadCount}
                </span>
                <span className="text-muted-foreground text-sm">
                  {plural(stage.leadCount, "lead")}
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-sm">
        <span className="font-medium text-foreground tabular-nums">{openTotal}</span>{" "}
        {plural(openTotal, "lead")} em aberto ·{" "}
        <span className="font-medium text-foreground tabular-nums">{wonTotal}</span>{" "}
        {plural(wonTotal, "fechado")} ·{" "}
        <span className="font-medium text-foreground tabular-nums">{lostTotal}</span>{" "}
        {plural(lostTotal, "perdido")}
      </p>
    </div>
  );
}
