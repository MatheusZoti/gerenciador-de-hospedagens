import type { LeadActivityItem } from "@hospedagens/core";
import {
  ArrowRightLeft,
  type LucideIcon,
  MessageCircle,
  Phone,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { formatMessageTime } from "@/lib/format";
import { SOURCE_LABEL } from "../labels";

const ICON: Record<LeadActivityItem["type"], LucideIcon> = {
  created: Sparkles,
  stage_changed: ArrowRightLeft,
  note: StickyNote,
  message: MessageCircle,
  call: Phone,
};

function describe(activity: LeadActivityItem): string {
  const payload = activity.payload as Record<string, string | undefined>;
  switch (activity.type) {
    case "created": {
      const source = payload.source as keyof typeof SOURCE_LABEL | undefined;
      const origin = source && SOURCE_LABEL[source] ? ` (via ${SOURCE_LABEL[source]})` : "";
      return `Lead criado em ${payload.stageName ?? "uma etapa"}${origin}`;
    }
    case "stage_changed":
      return `Moveu de ${payload.fromStageName ?? "?"} para ${payload.toStageName ?? "?"}`;
    case "note":
      return payload.text ?? "";
    case "message":
      return "Conversa registrada";
    case "call":
      return "Ligação registrada";
  }
}

export function LeadTimeline({
  activities,
  timeZone,
}: {
  activities: LeadActivityItem[];
  timeZone: string;
}) {
  if (activities.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhuma atividade ainda.</p>;
  }

  return (
    <ol className="relative flex flex-col gap-4 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
      {activities.map((activity) => {
        const Icon = ICON[activity.type];
        const isNote = activity.type === "note";
        return (
          <li key={activity.id} className="relative flex gap-3">
            <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p
                className={
                  isNote
                    ? "whitespace-pre-wrap rounded-lg bg-muted/70 px-3 py-2 text-foreground text-sm"
                    : "text-foreground text-sm"
                }
              >
                {describe(activity)}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                {formatMessageTime(activity.createdAt, { timeZone })}
                {activity.actorName ? ` · ${activity.actorName}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
