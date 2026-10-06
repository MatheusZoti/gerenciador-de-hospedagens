import type { LeadListItem } from "@hospedagens/core";
import type { Route } from "next";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMessageTime, formatPeriod, formatPhone } from "@/lib/format";
import { StageLabel } from "@/modules/pipeline/components/stage-label";
import { SOURCE_LABEL } from "../labels";

export function LeadsTable({ leads, timeZone }: { leads: LeadListItem[]; timeZone: string }) {
  return (
    <div className="rounded-xl border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Lead</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Imóvel de interesse</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Última mensagem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Link
                  href={`/leads/${lead.id}` as Route}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {lead.name}
                </Link>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {formatPhone(lead.phone) ?? lead.email ?? "Sem contato"}
                </p>
              </TableCell>
              <TableCell>
                <StageLabel name={lead.stageName} color={lead.stageColor} />
              </TableCell>
              <TableCell className="text-muted-foreground">{lead.propertyName ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{SOURCE_LABEL[lead.source]}</TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {formatPeriod(lead.desiredCheckIn, lead.desiredCheckOut) ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {lead.lastMessageAt ? formatMessageTime(lead.lastMessageAt, { timeZone }) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
