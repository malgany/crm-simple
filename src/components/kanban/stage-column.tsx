"use client";

import { useDroppable } from "@dnd-kit/core";
import { Inbox } from "lucide-react";
import type { Stage } from "@/lib/app.types";
import { cn } from "@/lib/utils";
import { DealCard } from "@/components/kanban/deal-card";

type StageColumnProps = {
  canAssign: boolean;
  onAssignToggle: (dealId: string, assignedUserId: string | null) => void;
  stage: Stage;
  onOpenDetails: (dealId: string) => void;
  viewerId: string;
};

export function StageColumn({
  canAssign,
  onAssignToggle,
  stage,
  onOpenDetails,
  viewerId,
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
        "surface-shadow flex min-h-[32rem] min-w-[19rem] max-w-[22rem] flex-1 flex-col rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-sm",
        isOver && "border-[var(--primary)] bg-white",
      )}
      ref={setNodeRef}
    >
      <header className="border-b border-slate-200/80 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{stage.name}</h2>
            <p className="text-sm text-slate-500">
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
              canAssign={canAssign}
              card={card}
              key={card.id}
              onAssignToggle={onAssignToggle}
              onOpenDetails={onOpenDetails}
              stageId={stage.id}
              viewerId={viewerId}
            />
          ))
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
            <Inbox className="mb-3 h-5 w-5 text-slate-400" />
            Nenhum card nesta etapa.
          </div>
        )}
      </div>
    </section>
  );
}
