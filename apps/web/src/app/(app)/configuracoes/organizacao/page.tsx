import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAppSession } from "@/lib/session";
import { updateOrganizationAction } from "@/modules/settings/actions";
import { BackToSettings } from "@/modules/settings/components/back-to-settings";
import { OrganizationForm } from "@/modules/settings/components/organization-form";
import { ReadOnlyNotice } from "@/modules/settings/components/read-only-notice";
import { timeZoneOptions } from "@/modules/settings/time-zones";

export const metadata: Metadata = { title: "Organização" };

export default async function OrganizacaoPage() {
  const { organization, canManage } = await requireAppSession();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <BackToSettings />
      <PageHeader
        title="Organização"
        description="O nome aparece no menu lateral; o fuso define como os horários são exibidos."
      />
      {canManage ? null : <ReadOnlyNotice />}
      <Card>
        <CardContent>
          <OrganizationForm
            action={updateOrganizationAction}
            defaults={{ name: organization.name, timeZone: organization.timeZone }}
            timeZones={timeZoneOptions(organization.timeZone)}
            canManage={canManage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
