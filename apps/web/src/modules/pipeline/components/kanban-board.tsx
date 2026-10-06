"use client";

import {
  type Announcements,
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { moveLeadAction } from "../actions";
import type { KanbanCard, KanbanColumn } from "../kanban-types";
import { EmptyColumn, KanbanColumnShell } from "./kanban-column-shell";
import { LeadCard } from "./lead-card";

/** Índice da coluna pelo id da etapa ou pelo id de um card dentro dela. */
function columnIndexOf(columns: KanbanColumn[], id: UniqueIdentifier) {
  const byStage = columns.findIndex((column) => column.stage.id === id);
  if (byStage >= 0) return byStage;
  return columns.findIndex((column) => column.cards.some((card) => card.id === id));
}

function positionOf(columns: KanbanColumn[], id: UniqueIdentifier) {
  const column = columnIndexOf(columns, id);
  const index = columns[column]?.cards.findIndex((card) => card.id === id) ?? -1;
  return { column, index, stageId: columns[column]?.stage.id };
}

/**
 * Kanban completo com arrastar e soltar (mouse, toque e teclado). A mudança
 * aparece na hora e é confirmada no servidor; se falhar, o quadro volta ao
 * estado anterior e um aviso é exibido.
 */
export function KanbanBoard({ columns: serverColumns }: { columns: KanbanColumn[] }) {
  const [columns, setColumns] = useState(serverColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const beforeDrag = useRef<KanbanColumn[] | null>(null);
  const [, startTransition] = useTransition();

  // Dados novos do servidor (após salvar ou navegar) passam a valer.
  useEffect(() => setColumns(serverColumns), [serverColumns]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const allCards = columns.flatMap((column) => column.cards);
  const activeCard = activeId ? allCards.find((card) => card.id === activeId) : undefined;
  const nameOf = (id: UniqueIdentifier) => allCards.find((card) => card.id === id)?.name ?? "Lead";
  const stageOf = (id: UniqueIdentifier) => columns[columnIndexOf(columns, id)]?.stage.name ?? "";

  const announcements: Announcements = {
    onDragStart: ({ active }) => `${nameOf(active.id)} selecionado na etapa ${stageOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} sobre a etapa ${stageOf(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} solto na etapa ${stageOf(over.id)}.`
        : `${nameOf(active.id)} solto fora das etapas.`,
    onDragCancel: ({ active }) => `Movimento cancelado. ${nameOf(active.id)} voltou ao lugar.`,
  };

  function onDragStart({ active }: DragStartEvent) {
    beforeDrag.current = columns;
    setActiveId(String(active.id));
  }

  // Ao passar sobre outra coluna, o card já muda de coluna na tela.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    setColumns((current) => {
      const from = columnIndexOf(current, active.id);
      const to = columnIndexOf(current, over.id);
      if (from < 0 || to < 0 || from === to) return current;

      const card = current[from]?.cards.find((item) => item.id === active.id);
      if (!card) return current;
      const overIndex = current[to]?.cards.findIndex((item) => item.id === over.id) ?? -1;

      return current.map((column, index) => {
        if (index === from) {
          return { ...column, cards: column.cards.filter((item) => item.id !== card.id) };
        }
        if (index === to) {
          const cards = [...column.cards];
          cards.splice(overIndex >= 0 ? overIndex : cards.length, 0, card);
          return { ...column, cards };
        }
        return column;
      });
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const snapshot = beforeDrag.current;
    beforeDrag.current = null;
    if (!snapshot) return;
    if (!over) {
      setColumns(snapshot);
      return;
    }

    // Reordenação dentro da coluna final.
    let next = columns;
    const column = columnIndexOf(next, active.id);
    if (column >= 0 && column === columnIndexOf(next, over.id)) {
      const cards = next[column]?.cards ?? [];
      const oldIndex = cards.findIndex((card) => card.id === active.id);
      const newIndex = cards.findIndex((card) => card.id === over.id);
      if (newIndex >= 0 && oldIndex !== newIndex) {
        next = next.map((item, index) =>
          index === column ? { ...item, cards: arrayMove(item.cards, oldIndex, newIndex) } : item,
        );
        setColumns(next);
      }
    }

    const target = positionOf(next, active.id);
    const origin = positionOf(snapshot, active.id);
    if (!target.stageId) return;
    if (target.stageId === origin.stageId && target.index === origin.index) return;

    const leadId = String(active.id);
    const toStageId = target.stageId;
    startTransition(async () => {
      const failed = (message?: string) => {
        setColumns(snapshot);
        toast.error(message ?? "Não foi possível mover o lead. Tente de novo.");
      };
      try {
        const result = await moveLeadAction({ leadId, toStageId, toIndex: target.index });
        if (result.status === "error") failed(result.message);
      } catch {
        failed();
      }
    });
  }

  function onDragCancel() {
    setActiveId(null);
    if (beforeDrag.current) setColumns(beforeDrag.current);
    beforeDrag.current = null;
  }

  return (
    <DndContext
      id="kanban"
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Para mover um lead, pressione espaço ou enter. Use as setas para trocar de posição ou de etapa, espaço ou enter para soltar e Esc para cancelar.",
        },
      }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="relative -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
        {columns.map((column) => (
          <DroppableColumn key={column.stage.id} column={column} />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? (
          <LeadCard card={activeCard} className="rotate-1 cursor-grabbing shadow-lg" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DroppableColumn({ column }: { column: KanbanColumn }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.stage.id });
  return (
    <KanbanColumnShell
      ref={setNodeRef}
      stage={column.stage}
      count={column.cards.length}
      className={cn("w-72 shrink-0 snap-start", isOver && "ring-2 ring-ring/40")}
    >
      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-24 flex-col gap-2">
          {column.cards.length === 0 ? <EmptyColumn /> : null}
          {column.cards.map((card) => (
            <SortableCard key={card.id} card={card} />
          ))}
        </div>
      </SortableContext>
    </KanbanColumnShell>
  );
}

function SortableCard({ card }: { card: KanbanCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    attributes: { roleDescription: "lead arrastável" },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab touch-manipulation rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        isDragging && "opacity-40",
      )}
    >
      <LeadCard card={card} />
    </div>
  );
}
