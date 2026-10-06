import {
  BarChart3,
  CalendarDays,
  Columns3,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  MessagesSquare,
  Settings,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type { Route } from "next";

export interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Menu lateral — a ordem segue o fluxo de trabalho do anfitrião. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Vendas",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/kanban", label: "Kanban", icon: Columns3 },
      { href: "/leads", label: "Leads", icon: Users },
      { href: "/conversas", label: "Conversas", icon: MessagesSquare },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/reservas", label: "Reservas", icon: CalendarDays },
      { href: "/financeiro", label: "Financeiro", icon: Wallet },
    ],
  },
  {
    label: "Crescimento",
    items: [
      { href: "/campanhas", label: "Campanhas", icon: Megaphone },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
  },
  {
    label: "Conta",
    items: [
      { href: "/configuracoes", label: "Configurações", icon: Settings },
      { href: "/perfil", label: "Perfil", icon: UserRound },
    ],
  },
];
