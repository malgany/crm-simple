import type { TableRow } from "@/lib/database.types";

export type ContactRecord = Pick<
  TableRow<"contacts">,
  | "created_at"
  | "email"
  | "id"
  | "name"
  | "origin"
  | "phone"
  | "phone_normalized"
  | "updated_at"
>;

export type NoteItem = {
  body: string;
  createdAt: string;
  dealId: string;
  id: string;
};

export type KanbanCard = {
  contact: ContactRecord;
  createdAt: string;
  id: string;
  movedAt: string;
  notes: NoteItem[];
  stageId: string;
};

export type Stage = {
  cards: KanbanCard[];
  id: string;
  name: string;
  position: number;
};

export type BoardData = {
  stages: Stage[];
};

export type ContactFormInput = {
  email?: string;
  name: string;
  origin?: string;
  phone: string;
  stageId: string;
};

export type MoveDealInput = {
  dealId: string;
  stageId: string;
};
