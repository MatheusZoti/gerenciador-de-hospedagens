/**
 * Dados prontos para exibir no Kanban. São montados no servidor
 * (`kanban-data.ts`) para que os componentes de cliente não dependam do
 * `core` nem calculem horários no fuso errado.
 */
export interface KanbanCard {
  id: string;
  name: string;
  href: string;
  propertyName: string | null;
  lastMessageLabel: string;
  periodLabel: string | null;
  whatsappUrl: string | null;
}

export interface KanbanColumn {
  stage: { id: string; name: string; color: string; kind: string };
  total: number;
  cards: KanbanCard[];
}
