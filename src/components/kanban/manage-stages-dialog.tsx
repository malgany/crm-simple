"use client";

import { ArrowDown, ArrowUp, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { toast } from "sonner";
import type { Stage } from "@/lib/app.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "@/components/theme/theme-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type StageDraft = {
  cardCount: number;
  id: string;
  isNew?: boolean;
  name: string;
  position: number;
};

type ManageStagesDialogProps = {
  onOpenChange: (open: boolean) => void;
  onSave: (drafts: StageDraft[]) => Promise<boolean>;
  open: boolean;
  stages: Stage[];
};

function reindexDrafts(drafts: StageDraft[]) {
  return drafts.map((draft, index) => ({
    ...draft,
    position: index,
  }));
}

export function ManageStagesDialog({
  onOpenChange,
  onSave,
  open,
  stages,
}: ManageStagesDialogProps) {
  const { theme } = useTheme();
  const stageDrafts = useMemo(
    () =>
      stages.map((stage) => ({
        cardCount: stage.cards.length,
        id: stage.id,
        name: stage.name,
        position: stage.position,
      })),
    [stages],
  );
  const [drafts, setDrafts] = useState<StageDraft[]>(stageDrafts);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDrafts(stageDrafts);
  }, [stageDrafts]);

  const moveDraft = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= drafts.length) {
      return;
    }

    const nextDrafts = [...drafts];
    const [draft] = nextDrafts.splice(index, 1);
    nextDrafts.splice(nextIndex, 0, draft);
    setDrafts(reindexDrafts(nextDrafts));
  };

  const handleRemove = (draft: StageDraft) => {
    if (draft.cardCount > 0) {
      toast.error("Mova os cards antes de remover esta etapa.");
      return;
    }

    if (drafts.length === 1) {
      toast.error("O funil precisa manter pelo menos uma etapa.");
      return;
    }

    const confirmed = window.confirm(
      `Remover a etapa "${draft.name || "Sem nome"}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDrafts((current) =>
      reindexDrafts(current.filter((item) => item.id !== draft.id)),
    );
  };

  const handleSave = async () => {
    const normalized = reindexDrafts(
      drafts.map((draft) => ({
        ...draft,
        name: draft.name.trim(),
      })),
    );

    if (normalized.some((draft) => !draft.name)) {
      toast.error("Todas as etapas precisam ter nome.");
      return;
    }

    setIsSaving(true);
    const success = await onSave(normalized);
    setIsSaving(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const dialogStyle = {
    ["--border" as string]: "var(--board-dialog-border)",
    ["--input-surface" as string]: "var(--board-dialog-input-surface)",
    background: theme === "light" ? "#ffffff" : "var(--board-dialog-surface)",
    borderColor: "var(--board-dialog-border)",
  } satisfies CSSProperties;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent 
        className="flex max-h-[90vh] w-[min(94vw,42rem)] flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl md:p-0"
        style={dialogStyle}
      >
        <DialogHeader 
          className="mb-0 border-b px-6 py-5 md:px-7 shrink-0" 
          style={{ borderColor: "var(--board-dialog-border)" }}
        >
          <DialogTitle className="text-xl font-bold">Configurar etapas</DialogTitle>
          <DialogDescription className="mt-1">
            Crie, renomeie, reordene e remova colunas vazias do funil.
          </DialogDescription>
        </DialogHeader>

        <div 
          className="custom-scrollbar min-h-0 flex-1 overflow-y-auto space-y-4 px-6 py-6 md:px-7"
          style={{ background: "var(--board-dialog-section-surface)" }}
        >
          {drafts.map((draft, index) => (
            <div
              className="rounded-[var(--radius-lg)] border p-4 surface-shadow"
              key={draft.id}
              style={{ 
                background: "var(--board-dialog-input-surface)",
                borderColor: "var(--board-dialog-border)"
              }}
            >
              <div className="mb-2 flex items-center justify-between gap-3 border-b pb-2" style={{ borderColor: "var(--board-dialog-border)" }}>
                <Label htmlFor={`stage-${draft.id}`} className="font-semibold text-sm">
                  Etapa {String(index + 1).padStart(2, "0")}
                </Label>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {draft.cardCount} card{draft.cardCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-col gap-3 md:flex-row mt-3">
                <Input
                  className="rounded-[0.55rem] border border-[var(--board-dialog-border)] bg-[var(--board-dialog-section-surface)] px-4 text-sm outline-none transition-[border-color,box-shadow,background-color] focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
                  id={`stage-${draft.id}`}
                  onChange={(event) => {
                    const name = event.target.value;
                    setDrafts((current) =>
                      current.map((item) =>
                        item.id === draft.id ? { ...item, name } : item,
                      ),
                    );
                  }}
                  value={draft.name}
                />
                <div className="flex gap-2 shrink-0">
                  <Button
                    aria-label="Subir etapa"
                    className="border-[var(--board-dialog-border)] bg-[var(--board-dialog-section-surface)] hover:bg-[var(--board-dialog-surface)]"
                    onClick={() => moveDraft(index, -1)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label="Descer etapa"
                    className="border-[var(--board-dialog-border)] bg-[var(--board-dialog-section-surface)] hover:bg-[var(--board-dialog-surface)]"
                    onClick={() => moveDraft(index, 1)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label="Remover etapa"
                    className="text-[var(--danger)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] bg-transparent"
                    onClick={() => handleRemove(draft)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div 
          className="flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-7 md:py-6 shrink-0"
          style={{ 
            borderColor: "var(--board-dialog-border)",
            background: "var(--board-dialog-section-surface)" 
          }}
        >
          <Button
            className="border-[var(--board-dialog-border)] bg-transparent hover:bg-[var(--board-dialog-surface)] hover:text-[var(--foreground)]"
            onClick={() =>
              setDrafts((current) =>
                reindexDrafts([
                  ...current,
                  {
                    cardCount: 0,
                    id: `new-${crypto.randomUUID()}`,
                    isNew: true,
                    name: "",
                    position: current.length,
                  },
                ]),
              )
            }
            type="button"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Nova etapa
          </Button>
          <div className="flex justify-end gap-3">
            <Button 
              className="hover:bg-[var(--board-dialog-surface)] border-[var(--board-dialog-border)] bg-transparent"
              onClick={() => onOpenChange(false)} 
              type="button" 
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={isSaving}
              onClick={handleSave}
              type="button"
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Salvar alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
