import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DealCard } from "./deal-card";
import type { KanbanCard } from "@/lib/app.types";

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    isDragging: false,
    isOver: false,
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  }),
}));

const mockCard: KanbanCard = {
  id: "deal-1",
  stageId: "stage-1",
  createdAt: "2023-01-01T00:00:00.000Z",
  movedAt: "2023-01-01T00:00:00.000Z",
  assignedUser: null,
  notes: [],
  contact: {
    id: "contact-1",
    name: "John Doe",
    phone: "11999990000",
    phone_normalized: "11999990000",
    email: "john@example.com",
    origin: "Site",
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  },
};

test("renderiza o DealCard com o layout padrão (Modo Simples desativado)", () => {
  render(
    <DealCard
      card={mockCard}
      stageId="stage-1"
      onOpenDetails={vi.fn()}
      isSimpleMode={false}
    />
  );

  // Deve exibir o nome como contato
  expect(screen.getByText("John Doe")).toBeInTheDocument();
  // Deve exibir o telefone formatado
  expect(screen.getByText("(11) 99999-0000")).toBeInTheDocument();
  // Deve exibir os atalhos de email e whatsapp (visíveis por label de aria)
  expect(screen.getByLabelText("WhatsApp")).toBeInTheDocument();
  expect(screen.getByLabelText("Telefone")).toBeInTheDocument();
  expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
});

test("renderiza o DealCard com o layout do Modo Simples ativado", () => {
  render(
    <DealCard
      card={mockCard}
      stageId="stage-1"
      onOpenDetails={vi.fn()}
      isSimpleMode={true}
    />
  );

  // Deve exibir o nome do card que no modo simples age como descrição
  expect(screen.getByText("John Doe")).toBeInTheDocument();
  // Não deve exibir telefone formatado
  expect(screen.queryByText("(11) 99999-0000")).not.toBeInTheDocument();
  // As opções de quick action sumiram
  expect(screen.queryByLabelText("WhatsApp")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Telefone")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
});
