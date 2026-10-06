import { AVATAR_MAX_BYTES } from "@hospedagens/core";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppSession } from "@/lib/session";
import { getFileStorage } from "@/lib/storage/r2";
import {
  removeAvatarAction,
  updateProfileAction,
  uploadAvatarAction,
} from "@/modules/profile/actions";
import { AvatarForm } from "@/modules/profile/components/avatar-form";
import { ProfileForm } from "@/modules/profile/components/profile-form";

export const metadata: Metadata = { title: "Perfil" };

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietário(a)",
  admin: "Administrador(a)",
  member: "Membro",
};

export default async function PerfilPage() {
  const { user, organization, ctx } = await requireAppSession();

  const account = [
    { label: "E-mail", value: user.email },
    { label: "Organização", value: organization.name },
    { label: "Papel na organização", value: ROLE_LABEL[ctx.role] ?? ctx.role },
  ];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title="Perfil" description="Seus dados e como você aparece no app." />

      <Card>
        <CardHeader>
          <CardTitle>Foto e dados</CardTitle>
          <CardDescription>Nome, cargo e foto aparecem no menu lateral.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <AvatarForm
            name={user.name}
            image={user.image ?? null}
            storageEnabled={getFileStorage() !== null}
            maxBytes={AVATAR_MAX_BYTES}
            uploadAction={uploadAvatarAction}
            removeAction={removeAvatarAction}
          />
          <ProfileForm
            action={updateProfileAction}
            defaults={{ name: user.name, jobTitle: user.jobTitle ?? "" }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y rounded-lg border">
            {account.map((field) => (
              <div key={field.label} className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="text-muted-foreground text-sm">{field.label}</dt>
                <dd className="text-foreground text-sm sm:col-span-2">{field.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
