"use client";

import { DndContext, DragOverlay, closestCorners, type DragEndEvent } from "@dnd-kit/core";
import {
  LockKeyhole,
  Plus,
  Search,
  Shield,
  Settings2,
  Users,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { ContactDialog } from "@/components/kanban/contact-dialog";
import {
  ManageStagesDialog,
  type StageDraft,
} from "@/components/kanban/manage-stages-dialog";
import { NewContactDialog } from "@/components/kanban/new-contact-dialog";
import { ResetPasswordDialog } from "@/components/kanban/reset-password-dialog";
import { StageColumn } from "@/components/kanban/stage-column";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CompanyUserSummary,
  ContactRecord,
  KanbanCard,
  NoteItem,
  MoveDealInput,
  Stage,
  ViewerSession,
} from "@/lib/app.types";
import { requestApi } from "@/lib/client-api";
import {
  appendNoteToCard,
  buildBoardState,
  filterStages,
  mergeStageStructure,
  moveCardLocally,
  prependCard,
  removeCard,
  updateCardAssignment,
  updateCardContact,
} from "@/lib/kanban";
import type { ContactSchema, NoteSchema, UpdateContactSchema } from "@/lib/validation";
import { getErrorMessage, normalizeOptionalText, normalizePhone } from "@/lib/utils";

const AUTO_REFRESH_MS = 15000;

type KanbanPageProps = {
  canManageStages: boolean;
  canManageUsers: boolean;
  companyId: string;
  initialStages: Stage[];
  viewer: ViewerSession;
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

export function KanbanPage({
  canManageStages,
  canManageUsers,
  companyId,
  initialStages,
  viewer,
}: KanbanPageProps) {
  const router = useRouter();
  const [stages, setStages] = useState(() => buildBoardState(initialStages));
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [dragDealId, setDragDealId] = useState<string | null>(null);
  const [dialogFocus, setDialogFocus] = useState<"details" | "notes">("details");
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [manageStagesOpen, setManageStagesOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchQuery);
  const filteredStages = filterStages(stages, deferredSearch);
  const filteredCardCount = useMemo(
    () =>
      filteredStages.reduce((total, stage) => total + stage.cards.length, 0),
    [filteredStages],
  );
  const selectedCard = findCard(stages, selectedDealId);
  const activeDragCard = findCard(stages, dragDealId);
  const mountedRef = useRef(true);
  const dragDealIdRef = useRef<string | null>(null);
  const selectedDealIdRef = useRef<string | null>(null);
  const newContactOpenRef = useRef(false);
  const manageStagesOpenRef = useRef(false);
  const resetPasswordOpenRef = useRef(false);
  const mutationCountRef = useRef(0);
  const refreshInFlightRef = useRef(false);
  const pendingRefreshRef = useRef(false);
  const refreshBoardRef = useRef<() => Promise<void>>(async () => {});

  const isBoardLocked = () =>
    dragDealIdRef.current !== null ||
    selectedDealIdRef.current !== null ||
    newContactOpenRef.current ||
    manageStagesOpenRef.current ||
    resetPasswordOpenRef.current ||
    mutationCountRef.current > 0;

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

  const beginMutation = () => {
    mutationCountRef.current += 1;
  };

  const endMutation = () => {
    mutationCountRef.current = Math.max(0, mutationCountRef.current - 1);

    if (mutationCountRef.current === 0 && pendingRefreshRef.current && !isBoardLocked()) {
      void refreshBoard();
    }
  };

  async function refreshBoard() {
    if (refreshInFlightRef.current) {
      pendingRefreshRef.current = true;
      return;
    }

    if (isBoardLocked()) {
      pendingRefreshRef.current = true;
      return;
    }

    refreshInFlightRef.current = true;
    pendingRefreshRef.current = false;

    try {
      const response = await requestApi<{ board: { stages: Stage[] } }>(
        "/api/board",
        {
          cache: "no-store",
          method: "GET",
        },
        companyId,
      );
      const board = response.board;
      const nextStages = buildBoardState(board.stages);

      if (!mountedRef.current) {
        return;
      }

      setStages(nextStages);

      if (
        selectedDealIdRef.current &&
        !findCard(nextStages, selectedDealIdRef.current)
      ) {
        setSelectedDealId(null);
        setDialogFocus("details");
      }
    } catch (error) {
      console.error("Board refresh failed", error);
    } finally {
      refreshInFlightRef.current = false;

      if (pendingRefreshRef.current && !isBoardLocked()) {
        void refreshBoard();
      }
    }
  }

  refreshBoardRef.current = refreshBoard;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    dragDealIdRef.current = dragDealId;
    selectedDealIdRef.current = selectedDealId;
    newContactOpenRef.current = newContactOpen;
    manageStagesOpenRef.current = manageStagesOpen;
    resetPasswordOpenRef.current = resetPasswordOpen;

    if (pendingRefreshRef.current && !isBoardLocked()) {
      void refreshBoardRef.current();
    }
  }, [dragDealId, manageStagesOpen, newContactOpen, resetPasswordOpen, selectedDealId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void refreshBoardRef.current();
    }, AUTO_REFRESH_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshBoardRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [companyId]);

  const handleMoveDeal = async ({ dealId, stageId }: MoveDealInput) => {
    const currentCard = findCard(stages, dealId);

    if (!currentCard || currentCard.stageId === stageId) {
      return true;
    }

    const previousStages = stages;
    beginMutation();

    try {
      const movedAt = new Date().toISOString();
      setStages((current) => moveCardLocally(current, dealId, stageId, movedAt));

      const response = await requestApi<{ moved: { movedAt: string; stageId: string } }>(
        `/api/board/deals/${dealId}/move`,
        {
          body: JSON.stringify({ stageId }),
          method: "PATCH",
        },
        companyId,
      );
      setStages((current) =>
        moveCardLocally(
          current,
          dealId,
          response.moved.stageId,
          response.moved.movedAt,
        ),
      );

      pendingRefreshRef.current = true;
      toast.success("Card movido.");
      return true;
    } catch (error) {
      setStages(previousStages);
      toast.error(getErrorMessage(error, "Nao foi possivel mover o card."));
      return false;
    } finally {
      endMutation();
    }
  };

  const handleCreateContact = async (values: ContactSchema) => {
    beginMutation();

    try {
      const response = await requestApi<{ card: KanbanCard }>(
        "/api/board/contacts",
        {
          body: JSON.stringify(values),
          method: "POST",
        },
        companyId,
      );
      setStages((current) => prependCard(current, values.stageId, response.card));
      pendingRefreshRef.current = true;
      toast.success("Contato criado.");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel criar o contato."));
      return false;
    } finally {
      endMutation();
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

    const previousStages = stages;
    beginMutation();

    try {
      const nextContact: ContactRecord = {
        ...currentCard.contact,
        email: normalizeOptionalText(values.email),
        name: values.name.trim(),
        origin: normalizeOptionalText(values.origin),
        phone: values.phone.trim(),
        phone_normalized: normalizePhone(values.phone),
        updated_at: new Date().toISOString(),
      };
      setStages((current) => updateCardContact(current, dealId, nextContact));

      const response = await requestApi<{ contact: ContactRecord }>(
        `/api/board/deals/${dealId}/contact`,
        {
          body: JSON.stringify(values),
          method: "PATCH",
        },
        companyId,
      );
      setStages((current) => updateCardContact(current, dealId, response.contact));

      pendingRefreshRef.current = true;
      toast.success("Contato atualizado.");
      return true;
    } catch (error) {
      setStages(previousStages);
      toast.error(getErrorMessage(error, "Nao foi possivel atualizar o contato."));
      return false;
    } finally {
      endMutation();
    }
  };

  const handleAddNote = async (dealId: string, values: NoteSchema) => {
    beginMutation();

    try {
      const response = await requestApi<{ note: NoteItem }>(
        `/api/board/deals/${dealId}/notes`,
        {
          body: JSON.stringify(values),
          method: "POST",
        },
        companyId,
      );

      setStages((current) =>
        appendNoteToCard(current, dealId, response.note),
      );
      pendingRefreshRef.current = true;
      toast.success("Observacao registrada.");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel registrar a observacao."));
      return false;
    } finally {
      endMutation();
    }
  };

  const handleDeleteContact = async (dealId: string) => {
    const previousStages = stages;
    beginMutation();

    try {
      setStages((current) => removeCard(current, dealId));
      setSelectedDealId(null);
      setDialogFocus("details");

      await requestApi(
        `/api/board/deals/${dealId}/contact`,
        {
          method: "DELETE",
        },
        companyId,
      );

      pendingRefreshRef.current = true;
      toast.success("Contato excluido.");
      return true;
    } catch (error) {
      setStages(previousStages);
      setSelectedDealId(dealId);
      toast.error(getErrorMessage(error, "Nao foi possivel excluir o contato."));
      return false;
    } finally {
      endMutation();
    }
  };

  const handleAssignDeal = async (dealId: string, assignedUserId: string | null) => {
    const previousStages = stages;
    const optimisticAssignedUser: CompanyUserSummary | null =
      assignedUserId === viewer.id
        ? {
            auth_user_id: viewer.id,
            email: viewer.email,
            name: viewer.name,
            role: viewer.role === "admin" ? "admin" : "member",
            status: "active",
          }
        : null;

    beginMutation();

    try {
      setStages((current) =>
        updateCardAssignment(current, dealId, optimisticAssignedUser),
      );

      const response = await requestApi<{ assignedUser: CompanyUserSummary | null }>(
        `/api/board/deals/${dealId}/assign`,
        {
          body: JSON.stringify({ assignedUserId }),
          method: "PATCH",
        },
        companyId,
      );

      setStages((current) =>
        updateCardAssignment(current, dealId, response.assignedUser),
      );
      pendingRefreshRef.current = true;
      toast.success(
        response.assignedUser ? "Card assinado." : "Assinatura liberada.",
      );
      return true;
    } catch (error) {
      setStages(previousStages);
      toast.error(getErrorMessage(error, "Nao foi possivel atualizar a assinatura."));
      return false;
    } finally {
      endMutation();
    }
  };

  const handleSaveStages = async (drafts: StageDraft[]) => {
    beginMutation();

    try {
      const response = await requestApi<{
        stages: Array<Pick<Stage, "id" | "name" | "position">>;
      }>(
        "/api/board/stages",
        {
          body: JSON.stringify({ drafts }),
          method: "PUT",
        },
        companyId,
      );

      setStages((current) => mergeStageStructure(current, response.stages));
      pendingRefreshRef.current = true;
      toast.success("Etapas atualizadas.");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel salvar as etapas."));
      return false;
    } finally {
      endMutation();
    }
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchDraft);
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

  const usersPath = viewer.isSuperadmin
    ? `/usuarios?companyId=${companyId}`
    : "/usuarios";
  const roleLabel = viewer.isSuperadmin
    ? "Superadmin"
    : viewer.role === "admin"
      ? "Admin"
      : "Usuario";
  const menuItems = [
    ...(canManageStages
      ? [{
          icon: Settings2,
          label: "Configurar etapas",
          onSelect: () => setManageStagesOpen(true),
        }]
      : []),
    ...(canManageUsers
      ? [{
          icon: Users,
          label: "Usuarios",
          onSelect: () => router.push(usersPath),
        }]
      : []),
    ...(!viewer.isSuperadmin
      ? [{
          icon: LockKeyhole,
          label: "Redefinir senha",
          onSelect: () => setResetPasswordOpen(true),
        }]
      : []),
    ...(viewer.isSuperadmin
      ? [{
          icon: Shield,
          label: "Voltar para empresas",
          onSelect: () => router.push("/admin/empresas"),
        }]
      : []),
  ];

  return (
    <main className="min-h-screen px-4 py-5 md:px-8 md:py-6">
      <AppHeader
        companyName={viewer.companyName}
        menuItems={menuItems}
        roleLabel={roleLabel}
      />

      <section className="mt-4 px-1">
        <h1 className="text-2xl font-semibold text-slate-950">Kanban</h1>
      </section>

      <section className="surface-shadow mt-4 rounded-[1.75rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(20,94,99,0.1),transparent_30%),linear-gradient(180deg,#fffdf9_0%,#f5f1e8_100%)] p-4 md:p-5">
        <form className="flex flex-row items-center gap-3" onSubmit={handleSearchSubmit}>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-11 w-full rounded-full bg-white/95 pl-11"
              onChange={(event) => {
                const nextValue = event.target.value;
                setSearchDraft(nextValue);

                if (!nextValue.trim()) {
                  setSearchQuery("");
                }
              }}
              placeholder="Buscar por nome ou telefone (Enter)"
              value={searchDraft}
            />
          </div>

          <Button className="shrink-0" onClick={() => setNewContactOpen(true)} type="button" variant="secondary">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo contato</span>
          </Button>
        </form>
        {searchQuery.trim() ? (
          <p className="mt-3 text-sm text-slate-600">
            {filteredCardCount} resultado{filteredCardCount === 1 ? "" : "s"} para{" "}
            <span className="font-semibold text-slate-800">{searchQuery.trim()}</span>
          </p>
        ) : null}
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
              stage={stage}
            />
          ))}
        </div>
        <DragOverlay zIndex={2000}>
          {activeDragCard ? (
            <div className="surface-shadow pointer-events-none w-[19rem] rounded-[1.5rem] border border-[var(--primary)] bg-white/95 p-4">
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
        open={canManageStages && manageStagesOpen}
        stages={stages}
      />
      <ResetPasswordDialog
        onOpenChange={setResetPasswordOpen}
        open={resetPasswordOpen}
        userEmail={viewer.email}
      />
      <ContactDialog
        canAssign={!viewer.isSuperadmin}
        card={selectedCard}
        initialFocus={dialogFocus}
        key={selectedCard?.id ?? "contact-dialog"}
        onAssign={handleAssignDeal}
        onAddNote={handleAddNote}
        onDeleteContact={handleDeleteContact}
        onMove={(dealId, stageId) => handleMoveDeal({ dealId, stageId })}
        onOpenChange={closeDialog}
        onUpdateContact={handleUpdateContact}
        open={!!selectedCard}
        stages={stages}
        viewerId={viewer.id}
      />
    </main>
  );
}

