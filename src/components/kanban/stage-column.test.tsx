import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { StageColumn } from "./stage-column";
import type { Stage } from "@/lib/app.types";

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({
    isOver: false,
    setNodeRef: vi.fn(),
  }),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  verticalListSortingStrategy: {},
}));

const mockStage: Stage = {
  id: "stage-1",
  name: "Prospecção",
  position: 0,
  cards: [],
};

test("renderiza StageColumn no layout padrão - botão Adicionar contato", () => {
  render(
    <StageColumn
      stage={mockStage}
      onAddContact={vi.fn()}
      onOpenDetails={vi.fn()}
      isSimpleMode={false}
    />
  );

  expect(screen.getByText("Adicionar contato")).toBeInTheDocument();
});

test("renderiza StageColumn no modo simples - botão Adicionar card", () => {
  render(
    <StageColumn
      stage={mockStage}
      onAddContact={vi.fn()}
      onOpenDetails={vi.fn()}
      isSimpleMode={true}
    />
  );

  expect(screen.getByText("Adicionar card")).toBeInTheDocument();
});
