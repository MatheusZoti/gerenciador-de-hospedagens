import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppSession } from "@/lib/session";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Perfil" };

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietário(a)",
  admin: "Administrador(a)",
  member: "Membro",
};

export default async function PerfilPage() {
  const { user, organization, ctx } = await requireAppSession();

  const fields = [
    { label: "Nome", value: user.name },
    { label: "E-mail", value: user.email },
    { label: "Cargo", value: user.jobTitle || "Não informado" },
    { label: "Organização", value: organization.name },
    { label: "Papel na organização", value: ROLE_LABEL[ctx.role] ?? ctx.role },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Perfil" description="Seus dados de acesso e como você aparece no app." />
      <Card className="max-w-2xl">
        <CardHeader className="flex items-center gap-4">
          <Avatar className="size-16">
            {user.image ? <AvatarImage src={user.image} alt="" /> : null}
            <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="text-lg">{user.name}</CardTitle>
            <CardDescription>{user.jobTitle || user.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="divide-y rounded-lg border">
            {fields.map((field) => (
              <div key={field.label} className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="text-muted-foreground text-sm">{field.label}</dt>
                <dd className="text-foreground text-sm sm:col-span-2">{field.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 flex items-center gap-2 text-muted-foreground text-xs">
            <Badge variant="soon">Fase 1</Badge>
            Edição de foto, nome e cargo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
