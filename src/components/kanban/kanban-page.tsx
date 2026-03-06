"use client";

import { DndContext, DragOverlay, closestCorners, type DragEndEvent } from "@dnd-kit/core";
import {
  LoaderCircle,
  LogOut,
  Plus,
  Search,
  Settings2,
  Workflow,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ContactDialog } from "@/components/kanban/contact-dialog";
import {
  ManageStagesDialog,
  type StageDraft,
} from "@/components/kanban/manage-stages-dialog";
import { NewContactDialog } from "@/components/kanban/new-contact-dialog";
import { StageColumn } from "@/components/kanban/stage-column";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  ContactRecord,
  KanbanCard,
  MoveDealInput,
  Stage,
} from "@/lib/app.types";
import {
  appendNoteToCard,
  buildBoardState,
  filterStages,
  mergeStageStructure,
  moveCardLocally,
  prependCard,
  updateCardContact,
} from "@/lib/kanban";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { ContactSchema, NoteSchema, UpdateContactSchema } from "@/lib/validation";
import {
  getErrorMessage,
  normalizeOptionalText,
  normalizePhone,
} from "@/lib/utils";

type KanbanPageProps = {
  initialStages: Stage[];
  userEmail: string;
};

function findCard(stages: Stage[], dealId: string | null) {
  if (!dealId) {
    return null;
  }

  for (const stage of stages) {
    const card = stage.cards.find((item) => item.id === dealId);

    if (card) {
      return card;
    }
  }

  return null;
}

function getDuplicateMessage(name: string) {
  return `Ja existe um contato com este telefone: ${name}.`;
}

export function KanbanPage({ initialStages, userEmail }: KanbanPageProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [stages, setStages] = useState(() => buildBoardState(initialStages));
  const [search, setSearch] = useState("");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [dragDealId, setDragDealId] = useState<string | null>(null);
  const [dialogFocus, setDialogFocus] = useState<"details" | "notes">("details");
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [manageStagesOpen, setManageStagesOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const filteredStages = filterStages(stages, deferredSearch);
  const selectedCard = findCard(stages, selectedDealId);
  const activeDragCard = findCard(stages, dragDealId);
  const totalCards = useMemo(
    () => stages.reduce((sum, stage) => sum + stage.cards.length, 0),
    [stages],
  );

  const openDeal = (dealId: string, focus: "details" | "notes" = "details") => {
    setSelectedDealId(dealId);
    setDialogFocus(focus);
  };

  const closeDialog = (open: boolean) => {
    if (!open) {
      setSelectedDealId(null);
      setDialogFocus("details");
    }
  };

  const lookupDuplicateByPhone = async (
    phoneNormalized: string,
    currentContactId?: string,
  ) => {
    let query = supabase
      .from("contacts")
      .select("id, name")
      .eq("phone_normalized", phoneNormalized)
      .limit(1);

    if (currentContactId) {
      query = query.neq("id", currentContactId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  };

  const handleMoveDeal = async ({ dealId, stageId }: MoveDealInput) => {
    const currentCard = findCard(stages, dealId);

    if (!currentCard || currentCard.stageId === stageId) {
      return true;
    }

    const movedAt = new Date().toISOString();
    const previousStages = stages;
    setStages((current) => moveCardLocally(current, dealId, stageId, movedAt));

    const { error } = await supabase
      .from("deals")
      .update({
        moved_at: movedAt,
        stage_id: stageId,
      })
      .eq("id", dealId);

    if (error) {
      setStages(previousStages);
      toast.error(getErrorMessage(error, "Nao foi possivel mover o card."));
      return false;
    }

    toast.success("Card movido.");
    return true;
  };

  const handleCreateContact = async (values: ContactSchema) => {
    try {
      const phoneNormalized = normalizePhone(values.phone);
      const duplicate = await lookupDuplicateByPhone(phoneNormalized);

      if (duplicate) {
        toast.error(getDuplicateMessage(duplicate.name));
        return false;
      }

      const { data, error } = await supabase.rpc("create_contact_with_deal", {
        p_email: normalizeOptionalText(values.email),
        p_name: values.name.trim(),
        p_origin: normalizeOptionalText(values.origin),
        p_phone: values.phone.trim(),
        p_phone_normalized: phoneNormalized,
        p_stage_id: values.stageId,
      });

      if (error) {
        if (error.code === "23505") {
          const existingContact = await lookupDuplicateByPhone(phoneNormalized);

          if (existingContact) {
            toast.error(getDuplicateMessage(existingContact.name));
            return false;
          }
        }

        toast.error(getErrorMessage(error, "Nao foi possivel criar o contato."));
        return false;
      }

      const created = data?.[0];

      if (!created) {
        toast.error("O contato foi criado sem retorno valido do banco.");
        return false;
      }

      const now = new Date().toISOString();
      const newCard: KanbanCard = {
        contact: {
          created_at: now,
          email: normalizeOptionalText(values.email),
          id: created.contact_id,
          name: values.name.trim(),
          origin: normalizeOptionalText(values.origin),
          phone: values.phone.trim(),
          phone_normalized: phoneNormalized,
          updated_at: now,
        },
        createdAt: now,
        id: created.deal_id,
        movedAt: now,
        notes: [],
        stageId: values.stageId,
      };

      setStages((current) => prependCard(current, values.stageId, newCard));
      toast.success("Contato criado.");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel criar o contato."));
      return false;
    }
  };

  const handleUpdateContact = async (
    dealId: string,
    values: UpdateContactSchema,
  ) => {
    const currentCard = findCard(stages, dealId);

    if (!currentCard) {
      return false;
    }

    try {
      const phoneNormalized = normalizePhone(values.phone);
      const duplicate = await lookupDuplicateByPhone(
        phoneNormalized,
        currentCard.contact.id,
      );

      if (duplicate) {
        toast.error(getDuplicateMessage(duplicate.name));
        return false;
      }

      const nextContact: ContactRecord = {
        ...currentCard.contact,
        email: normalizeOptionalText(values.email),
        name: values.name.trim(),
        origin: normalizeOptionalText(values.origin),
        phone: values.phone.trim(),
        phone_normalized: phoneNormalized,
        updated_at: new Date().toISOString(),
      };
      const previousStages = stages;
      setStages((current) => updateCardContact(current, dealId, nextContact));

      const { error } = await supabase
        .from("contacts")
        .update({
          email: nextContact.email,
          name: nextContact.name,
          origin: nextContact.origin,
          phone: nextContact.phone,
          phone_normalized: nextContact.phone_normalized,
          updated_at: nextContact.updated_at,
        })
        .eq("id", currentCard.contact.id);

      if (error) {
        setStages(previousStages);
        toast.error(getErrorMessage(error, "Nao foi possivel atualizar o contato."));
        return false;
      }

      toast.success("Contato atualizado.");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel atualizar o contato."));
      return false;
    }
  };

  const handleAddNote = async (dealId: string, values: NoteSchema) => {
    const { data, error } = await supabase
      .from("notes")
      .insert({
        body: values.body.trim(),
        deal_id: dealId,
      })
      .select("*")
      .single();

    if (error || !data) {
      toast.error(getErrorMessage(error, "Nao foi possivel registrar a observacao."));
      return false;
    }

    setStages((current) =>
      appendNoteToCard(current, dealId, {
        body: data.body,
        createdAt: data.created_at,
        dealId: data.deal_id,
        id: data.id,
      }),
    );
    toast.success("Observacao registrada.");
    return true;
  };

  const handleSaveStages = async (drafts: StageDraft[]) => {
    try {
      const currentStageIds = new Set(stages.map((stage) => stage.id));
      const nextExistingIds = new Set(
        drafts.filter((draft) => !draft.isNew).map((draft) => draft.id),
      );
      const deletedStageIds = stages
        .filter((stage) => !nextExistingIds.has(stage.id))
        .map((stage) => stage.id);

      for (const stageId of deletedStageIds) {
        const { error } = await supabase.from("stages").delete().eq("id", stageId);

        if (error) {
          toast.error(getErrorMessage(error, "Nao foi possivel remover a etapa."));
          return false;
        }
      }

      const updates = drafts.filter((draft) => currentStageIds.has(draft.id));
      const insertDrafts = drafts.filter((draft) => draft.isNew);

      const updateResults = await Promise.all(
        updates.map((draft) =>
          supabase
            .from("stages")
            .update({
              name: draft.name.trim(),
              position: draft.position,
            })
            .eq("id", draft.id),
        ),
      );

      const updateError = updateResults.find((result) => result.error)?.error;

      if (updateError) {
        toast.error(getErrorMessage(updateError, "Nao foi possivel salvar as etapas."));
        return false;
      }

      for (const draft of insertDrafts) {
        const { error } = await supabase.from("stages").insert({
          name: draft.name.trim(),
          position: draft.position,
        });

        if (error) {
          toast.error(getErrorMessage(error, "Nao foi possivel criar uma nova etapa."));
          return false;
        }
      }

      const { data, error } = await supabase
        .from("stages")
        .select("id, name, position")
        .order("position");

      if (error || !data) {
        toast.error(getErrorMessage(error, "Nao foi possivel recarregar as etapas."));
        return false;
      }

      setStages((current) => mergeStageStructure(current, data));
      toast.success("Etapas atualizadas.");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel salvar as etapas."));
      return false;
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDragDealId(null);

    if (!event.over) {
      return;
    }

    const activeStageId = event.active.data.current?.stageId as string | undefined;
    const dealId = event.active.data.current?.dealId as string | undefined;
    const targetStageId =
      (event.over.data.current?.stageId as string | undefined) ??
      (typeof event.over.id === "string" ? event.over.id : undefined);

    if (!dealId || !activeStageId || !targetStageId || activeStageId === targetStageId) {
      return;
    }

    await handleMoveDeal({ dealId, stageId: targetStageId });
  };

  return (
    <main className="min-h-screen px-4 py-5 md:px-8 md:py-6">
      <section className="surface-shadow grid-pattern relative overflow-hidden rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(20,94,99,0.14),transparent_34%),linear-gradient(180deg,#fffdf9_0%,#f5f1e8_100%)] p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <Workflow className="h-4 w-4" />
              Atendimento e vendas
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                Negociacoes
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-700">
                Busca instantanea por nome ou telefone, observacoes para lembrar
                o contexto e movimentos persistidos no Supabase.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface-shadow rounded-[1.5rem] border border-white/70 bg-white/90 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Funil
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {stages.length}
              </p>
              <p className="text-sm text-slate-600">etapas ativas</p>
            </div>
            <div className="surface-shadow rounded-[1.5rem] border border-white/70 bg-white/90 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Pipeline
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {totalCards}
              </p>
              <p className="text-sm text-slate-600">cards em aberto</p>
            </div>
            <div className="surface-shadow rounded-[1.5rem] border border-white/70 bg-white/90 px-4 py-3">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Conta
              </p>
              <p className="mt-2 truncate text-lg font-semibold text-slate-950">
                {userEmail}
              </p>
              <p className="text-sm text-slate-600">sessao autenticada</p>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-12 rounded-full bg-white/95 pl-11"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou telefone"
              value={search}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setManageStagesOpen(true)} variant="outline">
              <Settings2 className="h-4 w-4" />
              Configurar etapas
            </Button>
            <Button onClick={() => setNewContactOpen(true)} variant="secondary">
              <Plus className="h-4 w-4" />
              Novo contato
            </Button>
            <Button
              disabled={isSigningOut}
              onClick={handleSignOut}
              variant="ghost"
            >
              {isSigningOut ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sair
            </Button>
          </div>
        </div>
      </section>

      <DndContext
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        onDragStart={(event) => {
          const dealId = event.active.data.current?.dealId as string | undefined;
          setDragDealId(dealId ?? null);
        }}
      >
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {filteredStages.map((stage) => (
            <StageColumn
              key={stage.id}
              onOpenDetails={(dealId) => openDeal(dealId, "details")}
              onOpenNotes={(dealId) => openDeal(dealId, "notes")}
              stage={stage}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDragCard ? (
            <div className="surface-shadow w-[19rem] rounded-[1.5rem] border border-[var(--primary)] bg-white/95 p-4">
              <p className="text-sm font-semibold text-slate-950">
                {activeDragCard.contact.name}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {activeDragCard.contact.phone}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <NewContactDialog
        onCreate={handleCreateContact}
        onOpenChange={setNewContactOpen}
        open={newContactOpen}
        stages={stages}
      />
      <ManageStagesDialog
        onOpenChange={setManageStagesOpen}
        onSave={handleSaveStages}
        open={manageStagesOpen}
        stages={stages}
      />
      <ContactDialog
        card={selectedCard}
        initialFocus={dialogFocus}
        key={selectedCard?.id ?? "contact-dialog"}
        onAddNote={handleAddNote}
        onMove={(dealId, stageId) => handleMoveDeal({ dealId, stageId })}
        onOpenChange={closeDialog}
        onUpdateContact={handleUpdateContact}
        open={!!selectedCard}
        stages={stages}
      />
    </main>
  );
}
