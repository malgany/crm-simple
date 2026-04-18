import type { ContactRecord, KanbanCard, NoteItem, Stage } from "@/lib/app.types";
import { normalizePhone } from "@/lib/utils";

function sortCards(cards: KanbanCard[]) {
  return [...cards].sort(
    (left, right) =>
      new Date(right.movedAt).getTime() - new Date(left.movedAt).getTime(),
  );
}

function normalizeSearchToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function buildBoardState(stages: Stage[]) {
  return [...stages]
    .sort((left, right) => left.position - right.position)
    .map((stage) => ({
      ...stage,
      cards: sortCards(stage.cards),
    }));
}

export function resolveInitialContactStageId(
  stages: Array<Pick<Stage, "id">>,
  preferredStageId?: string | null,
) {
  if (preferredStageId && stages.some((stage) => stage.id === preferredStageId)) {
    return preferredStageId;
  }

  return stages[0]?.id ?? "";
}

export function filterStages(stages: Stage[], rawQuery: string) {
  const query = normalizeSearchToken(rawQuery);
  const phoneQuery = normalizePhone(rawQuery);
  const hasPhoneQuery = phoneQuery.length > 0;

  if (!query) {
    return buildBoardState(stages);
  }

  return buildBoardState(stages).map((stage) => ({
    ...stage,
    cards: stage.cards.filter((card) => {
      const phone = normalizePhone(card.contact.phone);
      const phoneNormalized = normalizePhone(card.contact.phone_normalized);
      const name = normalizeSearchToken(card.contact.name);

      return (
        name.includes(query) ||
        (hasPhoneQuery &&
          (phone.includes(phoneQuery) || phoneNormalized.includes(phoneQuery)))
      );
    }),
  }));
}

export function moveCardLocally(
  stages: Stage[],
  dealId: string,
  targetStageId: string,
  movedAt: string,
) {
  let movingCard: KanbanCard | null = null;

  const updated = stages.map((stage) => {
    if (!stage.cards.some((card) => card.id === dealId)) {
      return stage;
    }

    const cards = stage.cards.filter((card) => {
      if (card.id === dealId) {
        movingCard = {
          ...card,
          movedAt,
          stageId: targetStageId,
        };
        return false;
      }

      return true;
    });

    return { ...stage, cards };
  });

  if (!movingCard) {
    return stages;
  }

  const nextMovingCard = movingCard;

  return updated.map((stage) => {
    if (stage.id !== targetStageId) {
      return {
        ...stage,
        cards: sortCards(stage.cards),
      };
    }

    return {
      ...stage,
      cards: sortCards([nextMovingCard, ...stage.cards]),
    };
  });
}

export function reorderCardWithinStage(
  stages: Stage[],
  stageId: string,
  activeDealId: string,
  overDealId: string,
) {
  return stages.map((stage) => {
    if (stage.id !== stageId) {
      return stage;
    }

    const activeIndex = stage.cards.findIndex((card) => card.id === activeDealId);
    const overIndex = stage.cards.findIndex((card) => card.id === overDealId);

    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
      return stage;
    }

    const nextCards = [...stage.cards];
    const [movingCard] = nextCards.splice(activeIndex, 1);
    nextCards.splice(overIndex, 0, movingCard);

    return {
      ...stage,
      cards: nextCards,
    };
  });
}

export function repositionCardLocally(
  stages: Stage[],
  activeDealId: string,
  targetStageId: string,
  overDealId?: string | null,
) {
  let movingCard: KanbanCard | null = null;
  let sourceStageId: string | null = null;

  const withoutActiveCard = stages.map((stage) => {
    const activeIndex = stage.cards.findIndex((card) => card.id === activeDealId);

    if (activeIndex === -1) {
      return stage;
    }

    sourceStageId = stage.id;
    movingCard = {
      ...stage.cards[activeIndex],
      stageId: targetStageId,
    };

    return {
      ...stage,
      cards: stage.cards.filter((card) => card.id !== activeDealId),
    };
  });

  if (!movingCard || !sourceStageId) {
    return stages;
  }

  const nextMovingCard = movingCard;

  return withoutActiveCard.map((stage) => {
    if (stage.id !== targetStageId) {
      return stage;
    }

    const nextCards = [...stage.cards];
    const targetIndex = overDealId
      ? nextCards.findIndex((card) => card.id === overDealId)
      : -1;

    nextCards.splice(targetIndex === -1 ? nextCards.length : targetIndex, 0, nextMovingCard);

    return {
      ...stage,
      cards: nextCards,
    };
  });
}

export function updateCardMovedAt(stages: Stage[], dealId: string, movedAt: string) {
  return stages.map((stage) => ({
    ...stage,
    cards: stage.cards.map((card) =>
      card.id === dealId ? { ...card, movedAt } : card,
    ),
  }));
}

export function resolveMovedAtForCardPosition(cards: KanbanCard[], dealId: string) {
  const index = cards.findIndex((card) => card.id === dealId);

  if (index === -1) {
    return new Date().toISOString();
  }

  const previousCard = cards[index - 1] ?? null;
  const nextCard = cards[index + 1] ?? null;

  if (!previousCard && !nextCard) {
    return new Date().toISOString();
  }

  if (!previousCard && nextCard) {
    const nextTime = new Date(nextCard.movedAt).getTime();
    return new Date(Math.max(Date.now(), nextTime + 60_000)).toISOString();
  }

  if (previousCard && !nextCard) {
    const previousTime = new Date(previousCard.movedAt).getTime();
    return new Date(previousTime - 60_000).toISOString();
  }

  const previousTime = new Date(previousCard!.movedAt).getTime();
  const nextTime = new Date(nextCard!.movedAt).getTime();
  const gap = previousTime - nextTime;

  if (gap > 1) {
    return new Date(nextTime + Math.floor(gap / 2)).toISOString();
  }

  if (previousTime - 1 > nextTime) {
    return new Date(previousTime - 1).toISOString();
  }

  return new Date().toISOString();
}

export function prependCard(stages: Stage[], stageId: string, card: KanbanCard) {
  return buildBoardState(
    stages.map((stage) =>
      stage.id === stageId
        ? { ...stage, cards: [card, ...stage.cards] }
        : { ...stage },
    ),
  );
}

export function updateCardContact(
  stages: Stage[],
  dealId: string,
  contact: ContactRecord,
) {
  return stages.map((stage) => ({
    ...stage,
    cards: stage.cards.map((card) =>
      card.id === dealId ? { ...card, contact } : card,
    ),
  }));
}

export function appendNoteToCard(
  stages: Stage[],
  dealId: string,
  note: NoteItem,
) {
  return stages.map((stage) => ({
    ...stage,
    cards: stage.cards.map((card) =>
      card.id === dealId
        ? { ...card, notes: [note, ...card.notes] }
        : card,
    ),
  }));
}

export function updateCardAssignment(
  stages: Stage[],
  dealId: string,
  assignedUser: KanbanCard["assignedUser"],
) {
  return stages.map((stage) => ({
    ...stage,
    cards: stage.cards.map((card) =>
      card.id === dealId ? { ...card, assignedUser } : card,
    ),
  }));
}

export function removeCard(stages: Stage[], dealId: string) {
  return stages.map((stage) => ({
    ...stage,
    cards: stage.cards.filter((card) => card.id !== dealId),
  }));
}

export function mergeStageStructure(
  previousStages: Stage[],
  nextStages: Array<Pick<Stage, "id" | "name" | "position">>,
) {
  const cardMap = new Map(previousStages.map((stage) => [stage.id, stage.cards]));

  return buildBoardState(
    nextStages.map((stage) => ({
      ...stage,
      cards: cardMap.get(stage.id) ?? [],
    })),
  );
}

export function generatePlaceholderPhone(stages: Stage[]) {
  const allCards = stages.flatMap((s) => s.cards);
  let maxPlaceholder = -1;

  for (const card of allCards) {
    const phone = card.contact.phone_normalized;
    // Check if it's a sequence of at least 10 digits starting with zeros
    if (phone.length >= 10 && /^0+\d*$/.test(phone)) {
      const val = parseInt(phone, 10);
      if (!isNaN(val) && val > maxPlaceholder) {
        maxPlaceholder = val;
      }
    }
  }

  const nextVal = maxPlaceholder + 1;
  return nextVal.toString().padStart(11, "0");
}
