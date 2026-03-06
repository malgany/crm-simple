import { describe, expect, it } from "vitest";
import type { Stage } from "./app.types";
import {
  appendNoteToCard,
  filterStages,
  mergeStageStructure,
  moveCardLocally,
  updateCardAssignment,
} from "./kanban";

const baseStages: Stage[] = [
  {
    cards: [
      {
        assignedUser: null,
        contact: {
          created_at: "2026-03-05T12:00:00.000Z",
          email: "ana@empresa.com",
          id: "contact-1",
          name: "Ána Souza",
          origin: "Instagram",
          phone: "(65) 99999-1111",
          phone_normalized: "65999991111",
          updated_at: "2026-03-05T12:00:00.000Z",
        },
        createdAt: "2026-03-05T12:00:00.000Z",
        id: "deal-1",
        movedAt: "2026-03-05T13:00:00.000Z",
        notes: [],
        stageId: "stage-a",
      },
    ],
    id: "stage-a",
    name: "Prospecção",
    position: 0,
  },
  {
    cards: [],
    id: "stage-b",
    name: "Contato",
    position: 1,
  },
];

describe("kanban helpers", () => {
  it("filters across all columns by name or phone", () => {
    expect(filterStages(baseStages, "Ana")[0].cards).toHaveLength(1);
    expect(filterStages(baseStages, "Souza")[0].cards).toHaveLength(1);
    expect(filterStages(baseStages, "6599999")[0].cards).toHaveLength(1);
    expect(filterStages(baseStages, "inexistente")[0].cards).toHaveLength(0);
  });

  it("moves a card to another column and updates timestamp ordering", () => {
    const moved = moveCardLocally(
      baseStages,
      "deal-1",
      "stage-b",
      "2026-03-05T14:00:00.000Z",
    );

    expect(moved[0].cards).toHaveLength(0);
    expect(moved[1].cards[0]?.stageId).toBe("stage-b");
  });

  it("appends notes with newest first", () => {
    const updated = appendNoteToCard(baseStages, "deal-1", {
      authorId: "user-1",
      authorName: "Ana",
      body: "Retornar amanha cedo",
      createdAt: "2026-03-05T15:00:00.000Z",
      dealId: "deal-1",
      id: "note-1",
    });

    expect(updated[0].cards[0]?.notes[0]?.id).toBe("note-1");
  });

  it("updates card assignment without changing stage structure", () => {
    const updated = updateCardAssignment(baseStages, "deal-1", {
      auth_user_id: "user-1",
      email: "ana@empresa.com",
      name: "Ana",
      role: "member",
      status: "active",
    });

    expect(updated[0].cards[0]?.assignedUser?.name).toBe("Ana");
  });

  it("merges new stage structure without losing cards", () => {
    const merged = mergeStageStructure(baseStages, [
      { id: "stage-b", name: "Contato", position: 0 },
      { id: "stage-a", name: "Prospecção", position: 1 },
    ]);

    expect(merged[1].cards[0]?.id).toBe("deal-1");
  });
});
