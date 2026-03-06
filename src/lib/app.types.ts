import type { TableRow } from "@/lib/database.types";

export type CompanyStatus = TableRow<"companies">["status"];
export type CompanyUserRole = TableRow<"company_users">["role"] | "superadmin";
export type CompanyUserStatus = TableRow<"company_users">["status"];

export type CompanySummary = Pick<TableRow<"companies">, "id" | "name" | "status">;
export type CompanyUserSummary = Pick<
  TableRow<"company_users">,
  "auth_user_id" | "email" | "name" | "role" | "status"
>;

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
  authorId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
  dealId: string;
  id: string;
};

export type KanbanCard = {
  assignedUser: CompanyUserSummary | null;
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

export type ViewerSession = {
  company: CompanySummary | null;
  companyContext: boolean;
  companyId: string | null;
  companyName: string | null;
  email: string;
  id: string;
  isSuperadmin: boolean;
  name: string;
  role: CompanyUserRole;
  status: CompanyUserStatus | "active";
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

export type AssignDealInput = {
  assignedUserId: string | null;
  dealId: string;
};

export type CompanyBoardPageData = {
  board: BoardData;
  viewer: ViewerSession;
};

export type UserManagementItem = CompanyUserSummary & {
  id: string;
};

export type CompanyListItem = CompanySummary & {
  adminCount: number;
  memberCount: number;
  totalUsers: number;
};

export type CompanyUserDraft = {
  confirmPassword: string;
  email: string;
  id: string;
  name: string;
  password: string;
  role: TableRow<"company_users">["role"];
  status: TableRow<"company_users">["status"];
};
