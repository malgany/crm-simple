"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Inbox, Plus } from "lucide-react";
import type { Stage } from "@/lib/app.types";
import { cn } from "@/lib/utils";
import { DealCard } from "@/components/kanban/deal-card";

type StageColumnProps = {
  isDragHighlighted?: boolean;
  onAddContact: (stageId: string) => void;
  onOpenDetails: (dealId: string) => void;
  stage: Stage;
};

export function StageColumn({
  isDragHighlighted = false,
  onAddContact,
  onOpenDetails,
  stage,
}: StageColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    data: {
      stageId: stage.id,
      type: "stage",
    },
    id: stage.id,
  });

  return (
    <section
      className={cn(
        "surface-shadow relative flex max-h-full min-h-0 w-[19.5rem] flex-none self-start flex-col overflow-hidden rounded-[0.75rem] border border-[var(--border)] backdrop-blur-sm transition-[border-color,box-shadow]",
        (isOver || isDragHighlighted) &&
          "!border-[#669DF1] !ring-2 !ring-[#669DF1]/85",
      )}
      ref={setNodeRef}
      style={{ background: "var(--board-column-surface)" }}
    >
      <header className="shrink-0 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="truncate text-sm font-semibold text-[var(--foreground)]">
            {stage.name}
          </h2>
          <span
            className="shrink-0 rounded-[var(--radius-md)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]"
            style={{ background: "var(--subtle-surface)" }}
          >
            {stage.cards.length}
          </span>
        </div>
      </header>
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3">
        <SortableContext
          items={stage.cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {stage.cards.length ? (
            stage.cards.map((card) => (
              <DealCard
                card={card}
                key={card.id}
                onOpenDetails={onOpenDetails}
                stageId={stage.id}
              />
            ))
          ) : (
            <div
              className="flex min-h-20 items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--muted-foreground)]"
              style={{ background: "var(--subtle-surface)" }}
            >
              <div className="flex flex-col items-center gap-2">
                <Inbox className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span>Arraste um card para esta etapa.</span>
              </div>
            </div>
          )}
        </SortableContext>
        <button
          className="inline-flex cursor-pointer items-center gap-2 rounded-[0.6rem] px-2 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-[background-color,color] hover:bg-white/5 hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          onClick={() => onAddContact(stage.id)}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Adicionar contato
        </button>
      </div>
    </section>
  );
}
