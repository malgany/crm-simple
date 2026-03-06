"use client";

import { useDroppable } from "@dnd-kit/core";
import { Inbox } from "lucide-react";
import type { Stage } from "@/lib/app.types";
import { cn } from "@/lib/utils";
import { DealCard } from "@/components/kanban/deal-card";

type StageColumnProps = {
  stage: Stage;
  onOpenDetails: (dealId: string) => void;
};

export function StageColumn({
  stage,
  onOpenDetails,
}: StageColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    data: {
      stageId: stage.id,
    },
    id: stage.id,
  });

  return (
    <section
      className={cn(
        "surface-shadow flex min-h-[32rem] min-w-[19rem] max-w-[22rem] flex-1 flex-col rounded-[2rem] border border-white/60 backdrop-blur-sm",
        isOver && "border-[var(--primary)]",
      )}
      ref={setNodeRef}
      style={{ background: isOver ? "var(--card)" : "var(--panel-surface)" }}
    >
      <header className="border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{stage.name}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {stage.cards.length} card{stage.cards.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-semibold text-[var(--secondary-foreground)]">
            {String(stage.position + 1).padStart(2, "0")}
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-3 p-4">
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
            className="flex flex-1 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]"
            style={{ background: "var(--subtle-surface)" }}
          >
            <Inbox className="mb-3 h-5 w-5 text-[var(--muted-foreground)]" />
            Nenhum card nesta etapa.
          </div>
        )}
      </div>
    </section>
  );
}
