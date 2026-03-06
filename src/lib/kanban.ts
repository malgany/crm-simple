import type { ContactRecord, KanbanCard, NoteItem, Stage } from "@/lib/app.types";
import { normalizePhone } from "@/lib/utils";

function sortCards(cards: KanbanCard[]) {
  return [...cards].sort(
    (left, right) =>
      new Date(right.movedAt).getTime() - new Date(left.movedAt).getTime(),
  );
}

export function buildBoardState(stages: Stage[]) {
  return [...stages]
    .sort((left, right) => left.position - right.position)
    .map((stage) => ({
      ...stage,
      cards: sortCards(stage.cards),
    }));
}

export function filterStages(stages: Stage[], rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    return buildBoardState(stages);
  }

  return buildBoardState(stages).map((stage) => ({
    ...stage,
    cards: stage.cards.filter((card) => {
      const phone = normalizePhone(card.contact.phone);
      const phoneNormalized = normalizePhone(card.contact.phone_normalized);
      const name = card.contact.name.toLowerCase();

      return (
        name.includes(query) ||
        phone.includes(query.replace(/\D/g, "")) ||
        phoneNormalized.includes(query.replace(/\D/g, ""))
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
