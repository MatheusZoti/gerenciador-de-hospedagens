import {
  Building2,
  ChevronRight,
  Columns3,
  type LucideIcon,
  MessageSquareText,
  Plug,
  Settings,
} from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Configurações" };

interface Section {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: Route;
}

const SECTIONS: Section[] = [
  {
    title: "Imóveis",
    description: "Cadastre, edite e desative os imóveis que você aluga.",
    icon: Building2,
    href: "/configuracoes/imoveis",
  },
  {
    title: "Organização",
    description: "Nome da organização e fuso horário.",
    icon: Settings,
  },
  {
    title: "Funil de vendas",
    description: "Renomear, reordenar e criar etapas do funil.",
    icon: Columns3,
  },
  {
    title: "Modelos de mensagem",
    description: "Textos do WhatsApp por etapa, com nome, imóvel e datas.",
    icon: MessageSquareText,
  },
  {
    title: "Integrações",
    description: "Chave de API para o site registrar leads automaticamente.",
    icon: Plug,
  },
];

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configurações"
        description="Ajustes da organização, do funil e das integrações."
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {SECTIONS.map((section) => {
          const content = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <section.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  {section.title}
                  {section.href ? null : <Badge variant="soon">Em breve</Badge>}
                </span>
                <span className="mt-0.5 block text-muted-foreground text-sm">
                  {section.description}
                </span>
              </span>
              {section.href ? (
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              ) : null}
            </>
          );
          return (
            <li key={section.title}>
              {section.href ? (
                <Link
                  href={section.href}
                  className="flex h-full items-center gap-4 rounded-xl border bg-card p-4 shadow-xs outline-none transition-colors hover:border-ring/40 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex h-full items-center gap-4 rounded-xl border border-dashed bg-card/60 p-4">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
