import { listProperties } from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import { ArrowLeft, Building2, Plus } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { requireAppSession } from "@/lib/session";

export const metadata: Metadata = { title: "Imóveis" };

export default async function ImoveisPage() {
  const { ctx } = await requireAppSession();
  const properties = await listProperties(getDb(), ctx);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/configuracoes"
        className="inline-flex items-center gap-1.5 self-start text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Configurações
      </Link>
      <PageHeader
        title="Imóveis"
        description="Os imóveis aparecem no cadastro de leads e, na fase 2, no calendário de reservas."
        actions={
          <Button asChild>
            <Link href="/configuracoes/imoveis/novo">
              <Plus aria-hidden /> Novo imóvel
            </Link>
          </Button>
        }
      />

      {properties.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center">
          <Building2 className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium text-foreground">Nenhum imóvel cadastrado</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            Cadastre seus imóveis para indicar o interesse de cada lead.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Imóvel</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="text-right">Hóspedes</TableHead>
                <TableHead className="text-right">Quartos</TableHead>
                <TableHead className="text-right">Diária base</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/configuracoes/imoveis/${item.id}` as Route}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.city ?? "—"}</TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {item.maxGuests ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {item.bedrooms ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {item.basePriceCents === null ? "—" : formatCurrency(item.basePriceCents)}
                  </TableCell>
                  <TableCell>
                    {item.isActive ? (
                      <Badge variant="secondary">Ativo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
