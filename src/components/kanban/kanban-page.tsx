"use client";

import { DndContext, DragOverlay, closestCorners, type DragEndEvent } from "@dnd-kit/core";
import {
  LockKeyhole,
  Plus,
  Search,
  Shield,
  Settings2,
  SunMoon,
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
import { useTheme } from "@/components/theme/theme-provider";
import { ContactDialog } from "@/components/kanban/contact-dialog";
import { DealCard } from "@/components/kanban/deal-card";
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

type MobileStageFilter = string | "all";

type MobileDealListItem = {
  card: KanbanCard;
  stageName: string;
};

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

function findStage(stages: Stage[], stageId: string | null) {
  if (!stageId) {
    return null;
  }

  return stages.find((stage) => stage.id === stageId) ?? null;
}

export function KanbanPage({
  canManageStages,
  canManageUsers,
  companyId,
  initialStages,
  viewer,
}: KanbanPageProps) {
  const router = useRouter();
  const { toggleTheme } = useTheme();
  const [stages, setStages] = useState(() => buildBoardState(initialStages));
  const [mobileStageId, setMobileStageId] = useState(() => initialStages[0]?.id ?? "");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [dragDealId, setDragDealId] = useState<string | null>(null);
  const [dialogFocus, setDialogFocus] = useState<"details" | "notes">("details");
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [manageStagesOpen, setManageStagesOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchQuery);
  const filteredStages = useMemo(
    () => filterStages(stages, deferredSearch),
    [deferredSearch, stages],
  );
  const hasSearchQuery = deferredSearch.trim().length > 0;
  const filteredCardCount = useMemo(
    () =>
      filteredStages.reduce((total, stage) => total + stage.cards.length, 0),
    [filteredStages],
  );
  const activeMobileStage = findStage(stages, mobileStageId);
  const activeMobileStageFilter: MobileStageFilter = hasSearchQuery ? "all" : mobileStageId;
  const mobileStageTabs = useMemo(
    () =>
      hasSearchQuery
        ? [{ count: filteredCardCount, id: "all" as const, label: "Todas" }]
        : stages.map((stage) => ({
          count: stage.cards.length,
          id: stage.id,
          label: stage.name,
        })),
    [filteredCardCount, hasSearchQuery, stages],
  );
  const mobileDealList = useMemo<MobileDealListItem[]>(() => {
    if (activeMobileStageFilter === "all") {
      return filteredStages.flatMap((stage) =>
        stage.cards.map((card) => ({
          card,
          stageName: stage.name,
        })),
      );
    }

    const stage = activeMobileStage ?? stages[0] ?? null;

    if (!stage) {
      return [];
    }

    return stage.cards.map((card) => ({
      card,
      stageName: stage.name,
    }));
  }, [activeMobileStage, activeMobileStageFilter, filteredStages, stages]);
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
  const refreshBoardRef = useRef<() => Promise<void>>(async () => { });

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
    if (!stages.length) {
      if (mobileStageId) {
        setMobileStageId("");
      }
      return;
    }

    if (!findStage(stages, mobileStageId)) {
      setMobileStageId(stages[0]?.id ?? "");
    }
  }, [mobileStageId, stages]);

  useEffect(() => {
    const trimmedDraft = searchDraft.trim();

    if (!trimmedDraft) {
      setSearchQuery("");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchDraft);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchDraft]);

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
      toast.error(getErrorMessage(error, "Não foi possível mover o card."));
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
      toast.error(getErrorMessage(error, "Não foi possível criar o contato."));
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
      toast.error(getErrorMessage(error, "Não foi possível atualizar o contato."));
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
      toast.success("Observação registrada.");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível registrar a observação."));
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
      toast.success("Contato excluído.");
      return true;
    } catch (error) {
      setStages(previousStages);
      setSelectedDealId(dealId);
      toast.error(getErrorMessage(error, "Não foi possível excluir o contato."));
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
      toast.error(getErrorMessage(error, "Não foi possível atualizar a assinatura."));
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
      toast.error(getErrorMessage(error, "Não foi possível salvar as etapas."));
      return false;
    } finally {
      endMutation();
    }
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchDraft.trim() ? searchDraft : "");
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
    ? `/admin/empresas/${companyId}`
    : "/usuarios";
  const roleLabel = viewer.isSuperadmin
    ? "Superadmin"
    : viewer.role === "admin"
      ? "Admin"
      : "Usuário";
  const activeSearchLabel = deferredSearch.trim();
  const activeMobileStageName =
    activeMobileStageFilter === "all"
      ? "Todas"
      : activeMobileStage?.name ?? "Etapa";
  const menuItems = [
    ...(viewer.isSuperadmin || canManageUsers
      ? [{
        icon: Users,
        label: "Usuários",
        onSelect: () => router.push(usersPath),
      }]
      : []),
    {
      icon: SunMoon,
      label: "Alternar tema",
      onSelect: toggleTheme,
    },
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
    <main className="flex h-[100dvh] flex-col px-4 py-5 md:px-8 md:py-6">
      <AppHeader
        companyName={viewer.companyName}
        menuItems={menuItems}
        roleLabel={roleLabel}
      />

      <section className="mt-4 px-1">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Kanban</h1>
      </section>

      <section
        className="surface-shadow mt-4 rounded-[1.75rem] border border-white/60 p-4 md:p-5"
        style={{ background: "var(--panel-accent-surface)" }}
      >
        <form
          className="flex flex-col gap-3 lg:flex-row lg:items-center"
          onSubmit={handleSearchSubmit}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="shrink-0"
              onClick={() => setNewContactOpen(true)}
              type="button"
              variant="secondary"
            >
              <Plus className="h-4 w-4" />
              <span>Novo contato</span>
            </Button>
            {canManageStages ? (
              <Button
                className="shrink-0"
                onClick={() => setManageStagesOpen(true)}
                type="button"
                variant="outline"
              >
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Configurar etapas</span>
              </Button>
            ) : null}
          </div>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              className="h-11 w-full rounded-full pl-11"
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Buscar por nome ou telefone"
              value={searchDraft}
            />
          </div>
        </form>
        {activeSearchLabel ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            {filteredCardCount} resultado{filteredCardCount === 1 ? "" : "s"} para{" "}
            <span className="font-semibold text-[var(--foreground)]">{activeSearchLabel}</span>
          </p>
        ) : null}
      </section>

      <section className="mt-6 flex min-h-0 flex-1 flex-col md:hidden">
        <div
          className="surface-shadow rounded-[1.5rem] border border-white/60 p-3"
          style={{ background: "var(--panel-surface)" }}
        >
          <div className="flex flex-wrap gap-2">
            {mobileStageTabs.map((tab) => {
              const isActive = tab.id === activeMobileStageFilter;

              return (
                <Button
                  className="rounded-full px-4"
                  key={tab.id}
                  onClick={() => {
                    if (tab.id !== "all") {
                      setMobileStageId(tab.id);
                    }
                  }}
                  size="sm"
                  type="button"
                  variant={isActive ? "secondary" : "outline"}
                >
                  <span>{tab.label}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: "var(--subtle-surface)" }}
                  >
                    {tab.count}
                  </span>
                </Button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            {mobileDealList.length} card{mobileDealList.length === 1 ? "" : "s"} em{" "}
            <span className="font-semibold text-[var(--foreground)]">{activeMobileStageName}</span>
          </p>
        </div>

        <div className="custom-scrollbar mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
          {mobileDealList.length ? (
            mobileDealList.map(({ card, stageName }) => (
              <DealCard
                card={card}
                contextLabel={activeMobileStageFilter === "all" ? stageName : null}
                draggable={false}
                key={card.id}
                onOpenDetails={(dealId) => openDeal(dealId, "details")}
                stageId={card.stageId}
              />
            ))
          ) : (
            <div
              className="surface-shadow flex min-h-52 flex-1 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]"
              style={{ background: "var(--panel-surface)" }}
            >
              {activeMobileStageFilter === "all"
                ? "Nenhum resultado para a busca atual."
                : `Nenhum card na etapa ${activeMobileStageName}.`}
            </div>
          )}
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
        <div className="custom-scrollbar mt-6 hidden min-h-0 flex-1 gap-4 overflow-x-auto pb-4 md:flex">
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
            <div
              className="surface-shadow pointer-events-none w-[19rem] rounded-[1.5rem] border border-[var(--primary)] p-4"
              style={{ background: "var(--card)" }}
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {activeDragCard.contact.name}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
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
