import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAppSession } from "@/lib/session";
import { createPropertyAction } from "@/modules/properties/actions";
import { PropertyForm } from "@/modules/properties/components/property-form";

export const metadata: Metadata = { title: "Novo imóvel" };

export default async function NewPropertyPage() {
  await requireAppSession();
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link
        href="/configuracoes/imoveis"
        className="inline-flex items-center gap-1.5 self-start text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Imóveis
      </Link>
      <PageHeader title="Novo imóvel" />
      <Card>
        <CardContent>
          <PropertyForm action={createPropertyAction} submitLabel="Cadastrar imóvel" />
        </CardContent>
      </Card>
    </div>
  );
}
