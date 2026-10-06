import { House } from "lucide-react";
import type * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <House className="size-[18px]" aria-hidden />
        </span>
        <span className="font-semibold text-foreground">Hospedagens CRM</span>
      </div>
      <Card className="py-6">
        <CardHeader className="px-6">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="px-6">{children}</CardContent>
      </Card>
      <p className="text-center text-muted-foreground text-sm">{footer}</p>
    </div>
  );
}
