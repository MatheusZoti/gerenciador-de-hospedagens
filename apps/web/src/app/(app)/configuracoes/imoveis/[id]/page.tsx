import { centsToInput, getProperty, NotFoundError } from "@hospedagens/core";
import { getDb } from "@hospedagens/db";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppSession } from "@/lib/session";
import { setPropertyActiveAction, updatePropertyAction } from "@/modules/properties/actions";
import { PropertyForm } from "@/modules/properties/components/property-form";

export const metadata: Metadata = { title: "Imóvel" };

export default async function PropertyPage({ params }: PageProps<"/configuracoes/imoveis/[id]">) {
  const { id } = await params;
  const { ctx } = await requireAppSession();
  const item = await getProperty(getDb(), ctx, id).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link
        href="/configuracoes/imoveis"
        className="inline-flex items-center gap-1.5 self-start text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Imóveis
      </Link>
      <PageHeader
        title={item.name}
        description={
          item.isActive ? undefined : (
            <Badge variant="outline" className="text-muted-foreground">
              Inativo
            </Badge>
          )
        }
      />
      <Card>
        <CardContent>
          <PropertyForm
            action={updatePropertyAction.bind(null, item.id)}
            submitLabel="Salvar alterações"
            defaults={{
              name: item.name,
              address: item.address ?? "",
              city: item.city ?? "",
              maxGuests: item.maxGuests?.toString() ?? "",
              bedrooms: item.bedrooms?.toString() ?? "",
              basePrice: centsToInput(item.basePriceCents),
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{item.isActive ? "Desativar imóvel" : "Reativar imóvel"}</CardTitle>
          <CardDescription>
            {item.isActive
              ? "Imóveis inativos deixam de aparecer no cadastro de leads, mas o histórico é mantido."
              : "O imóvel volta a aparecer no cadastro de leads."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={setPropertyActiveAction.bind(null, item.id, !item.isActive)}>
            <Button type="submit" variant="outline">
              {item.isActive ? "Desativar" : "Reativar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
