import { listLeads, listProperties, listStages } from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import { Plus, Users } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireAppSession } from "@/lib/session";
import { LeadsFilters, type LeadsFilterValues } from "@/modules/leads/components/leads-filters";
import { LeadsTable } from "@/modules/leads/components/leads-table";
import { isLeadSource, SOURCE_OPTIONS } from "@/modules/leads/labels";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const params = await searchParams;
  const param = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };
  const filters: LeadsFilterValues = {
    busca: param("busca"),
    etapa: param("etapa"),
    origem: param("origem"),
    imovel: param("imovel"),
  };
  const page = Math.max(1, Number.parseInt(param("pagina") ?? "1", 10) || 1);

  const { ctx, organization } = await requireAppSession();
  const db = getDb();
  const [result, stages, properties] = await Promise.all([
    listLeads(db, ctx, {
      search: filters.busca,
      stageId: filters.etapa,
      source: isLeadSource(filters.origem) ? filters.origem : undefined,
      propertyId: filters.imovel,
      page,
    }),
    listStages(db, ctx),
    listProperties(db, ctx),
  ]);

  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const pageHref = (target: number) => {
    const query = new URLSearchParams(
      Object.entries(filters).filter((entry): entry is [string, string] => Boolean(entry[1])),
    );
    if (target > 1) query.set("pagina", String(target));
    const search = query.toString();
    return (search ? `/leads?${search}` : "/leads") as Route;
  };
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leads"
        description="Todas as pessoas interessadas nas suas hospedagens."
        actions={
          <Button asChild>
            <Link href="/leads/novo">
              <Plus aria-hidden /> Novo lead
            </Link>
          </Button>
        }
      />

      <LeadsFilters
        values={filters}
        stages={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
        sources={SOURCE_OPTIONS}
        properties={properties.map((item) => ({ value: item.id, label: item.name }))}
      />

      {result.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center">
          <Users className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium text-foreground">
            {hasFilters
              ? "Nenhum lead encontrado com esses filtros"
              : "Nenhum lead cadastrado ainda"}
          </p>
          <p className="max-w-sm text-muted-foreground text-sm">
            {hasFilters
              ? "Tente outra busca ou limpe os filtros."
              : "Cadastre o primeiro lead para acompanhar a conversa até a reserva."}
          </p>
        </div>
      ) : (
        <>
          <LeadsTable leads={result.rows} timeZone={organization.timeZone} />
          <nav
            aria-label="Paginação"
            className="flex items-center justify-between gap-3 text-muted-foreground text-sm"
          >
            <p>
              {result.total} {result.total === 1 ? "lead" : "leads"}
              {pages > 1 ? ` · página ${result.page} de ${pages}` : ""}
            </p>
            {pages > 1 ? (
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" aria-disabled={result.page <= 1}>
                  <Link href={pageHref(result.page - 1)}>Anterior</Link>
                </Button>
                <Button asChild variant="outline" size="sm" aria-disabled={result.page >= pages}>
                  <Link href={pageHref(result.page + 1)}>Próxima</Link>
                </Button>
              </div>
            ) : null}
          </nav>
        </>
      )}
    </div>
  );
}
