"use client";

import { ArrowDown, ArrowUp, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(94vw,42rem)]">
        <DialogHeader>
          <DialogTitle>Configurar etapas</DialogTitle>
          <DialogDescription>
            Crie, renomeie, reordene e remova colunas vazias do funil.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {drafts.map((draft, index) => (
            <div
              className="rounded-[1.5rem] border border-[var(--border)] p-4"
              key={draft.id}
              style={{ background: "var(--subtle-surface)" }}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <Label htmlFor={`stage-${draft.id}`}>
                  Etapa {String(index + 1).padStart(2, "0")}
                </Label>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {draft.cardCount} card{draft.cardCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
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
                <div className="flex gap-2">
                  <Button
                    aria-label="Subir etapa"
                    onClick={() => moveDraft(index, -1)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label="Descer etapa"
                    onClick={() => moveDraft(index, 1)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label="Remover etapa"
                    onClick={() => handleRemove(draft)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
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
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
            Nova etapa
          </Button>
          <div className="flex justify-end gap-3">
            <Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
              Cancelar
            </Button>
            <Button disabled={isSaving} onClick={handleSave} type="button">
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Salvar alteracoes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
