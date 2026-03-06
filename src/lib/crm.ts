import "server-only";
import type {
  BoardData,
  CompanyListItem,
  CompanySummary,
  CompanyUserSummary,
  KanbanCard,
  NoteItem,
  Stage,
  UserManagementItem,
} from "@/lib/app.types";
import type { TableInsert, TableRow, TableUpdate } from "@/lib/database.types";
import type {
  CompanyCreateSchema,
  CompanyUpdateSchema,
  ContactSchema,
  MemberCreateSchema,
  MemberUpdateSchema,
  NoteSchema,
  StageDraftSchema,
  UpdateContactSchema,
} from "@/lib/validation";
import { normalizeOptionalText, normalizePhone } from "@/lib/utils";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type ContactRow = TableRow<"contacts">;
type DealRow = TableRow<"deals">;
type NoteRow = TableRow<"notes">;
type CompanyRow = TableRow<"companies">;
type CompanyUserRow = TableRow<"company_users">;

type CreateUserInput = {
  email: string;
  name: string;
  password: string;
  role: CompanyUserRow["role"];
  status: CompanyUserRow["status"];
};

function getAdminClient() {
  return createAdminSupabaseClient();
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function requireData<T>(data: T | null, message: string) {
  if (!data) {
    throw new Error(message);
  }

  return data;
}

function toCompanySummary(company: CompanyRow): CompanySummary {
  return {
    id: company.id,
    name: company.name,
    status: company.status,
  };
}

function toCompanyUserSummary(user: CompanyUserRow): CompanyUserSummary {
  return {
    auth_user_id: user.auth_user_id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}

function toNoteItem(note: NoteRow): NoteItem {
  return {
    authorId: note.author_user_id,
    authorName: note.author_name,
    body: note.body,
    createdAt: note.created_at,
    dealId: note.deal_id,
    id: note.id,
  };
}

async function loadAssignedUsers(companyId: string, userIds: string[]) {
  if (!userIds.length) {
    return new Map<string, CompanyUserSummary>();
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("company_users")
    .select("*")
    .eq("company_id", companyId)
    .in("auth_user_id", userIds)
    .neq("status", "deleted");

  throwIfError(error);

  return new Map((data ?? []).map((user) => [user.auth_user_id, toCompanyUserSummary(user)]));
}

async function loadCompanyStage(companyId: string, stageId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("stages")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", stageId)
    .maybeSingle();

  throwIfError(error);

  if (!data) {
    throw new Error("Etapa invalida para esta empresa.");
  }

  return data;
}

async function loadCompanyDeal(companyId: string, dealId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("deals")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", dealId)
    .maybeSingle();

  throwIfError(error);

  if (!data) {
    throw new Error("Negociacao nao encontrada.");
  }

  return data;
}

async function loadCompanyContact(companyId: string, contactId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("contacts")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", contactId)
    .maybeSingle();

  throwIfError(error);

  if (!data) {
    throw new Error("Contato nao encontrado.");
  }

  return data;
}

async function ensureDuplicatePhoneAvailable(
  companyId: string,
  phoneNormalized: string,
  currentContactId?: string,
) {
  const admin = getAdminClient();
  let query = admin
    .from("contacts")
    .select("id, name")
    .eq("company_id", companyId)
    .eq("phone_normalized", phoneNormalized)
    .limit(1);

  if (currentContactId) {
    query = query.neq("id", currentContactId);
  }

  const { data, error } = await query.maybeSingle();
  throwIfError(error);

  if (data) {
    throw new Error(`Ja existe um contato com este telefone: ${data.name}.`);
  }
}

async function seedCompanyStages(companyId: string) {
  const admin = getAdminClient();
  const { error } = await admin.rpc("seed_company_stages", {
    p_company_id: companyId,
  });

  throwIfError(error);
}

async function countActiveAdmins(companyId: string, excludingCompanyUserId?: string) {
  const admin = getAdminClient();
  let query = admin
    .from("company_users")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("role", "admin")
    .eq("status", "active");

  if (excludingCompanyUserId) {
    query = query.neq("id", excludingCompanyUserId);
  }

  const { count, error } = await query;
  throwIfError(error);
  return count ?? 0;
}

async function ensureCompanyUser(companyId: string, companyUserId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("company_users")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", companyUserId)
    .maybeSingle();

  throwIfError(error);

  if (!data) {
    throw new Error("Usuario nao encontrado nesta empresa.");
  }

  return data;
}

async function createAuthUser(input: CreateUserInput) {
  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    email_confirm: true,
    password: input.password,
    user_metadata: {
      name: input.name,
    },
  });

  throwIfError(error);

  if (!data.user) {
    throw new Error("Nao foi possivel criar o usuario de autenticacao.");
  }

  return data.user;
}

async function updateAuthUser(
  authUserId: string,
  payload: {
    email: string;
    name: string;
    password?: string;
  },
) {
  const admin = getAdminClient();
  const { error } = await admin.auth.admin.updateUserById(authUserId, {
    email: payload.email,
    password: payload.password || undefined,
    user_metadata: {
      name: payload.name,
    },
  });

  throwIfError(error);
}

async function deleteAuthUser(authUserId: string) {
  const admin = getAdminClient();
  const { error } = await admin.auth.admin.deleteUser(authUserId);
  throwIfError(error);
}

async function createCompanyUserRow(companyId: string, authUserId: string, input: CreateUserInput) {
  const admin = getAdminClient();
  const insert: TableInsert<"company_users"> = {
    auth_user_id: authUserId,
    company_id: companyId,
    email: input.email,
    name: input.name,
    role: input.role,
    status: input.status,
  };

  const { data, error } = await admin
    .from("company_users")
    .insert(insert)
    .select("*")
    .single();

  throwIfError(error);
  return requireData(data, "Usuario criado sem retorno valido.");
}

function buildCard(
  deal: DealRow,
  contact: ContactRow,
  notes: NoteItem[],
  assignedUsers: Map<string, CompanyUserSummary>,
): KanbanCard {
  return {
    assignedUser: deal.assigned_user_id
      ? assignedUsers.get(deal.assigned_user_id) ?? null
      : null,
    contact: {
      created_at: contact.created_at,
      email: contact.email,
      id: contact.id,
      name: contact.name,
      origin: contact.origin,
      phone: contact.phone,
      phone_normalized: contact.phone_normalized,
      updated_at: contact.updated_at,
    },
    createdAt: deal.created_at,
    id: deal.id,
    movedAt: deal.moved_at,
    notes,
    stageId: deal.stage_id,
  };
}

export async function loadBoardData(companyId: string): Promise<BoardData> {
  const admin = getAdminClient();
  const [stagesResult, dealsResult] = await Promise.all([
    admin.from("stages").select("*").eq("company_id", companyId).order("position"),
    admin
      .from("deals")
      .select("*")
      .eq("company_id", companyId)
      .order("moved_at", { ascending: false }),
  ]);

  throwIfError(stagesResult.error);
  throwIfError(dealsResult.error);

  const stages = stagesResult.data ?? [];
  const deals = dealsResult.data ?? [];
  const contactIds = deals.map((deal) => deal.contact_id);
  const dealIds = deals.map((deal) => deal.id);

  const [contactsResult, notesResult] = await Promise.all([
    contactIds.length
      ? admin.from("contacts").select("*").in("id", contactIds)
      : Promise.resolve({ data: [] as ContactRow[], error: null }),
    dealIds.length
      ? admin
          .from("notes")
          .select("*")
          .in("deal_id", dealIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as NoteRow[], error: null }),
  ]);

  throwIfError(contactsResult.error);
  throwIfError(notesResult.error);

  const assignedUserIds = deals
    .map((deal) => deal.assigned_user_id)
    .filter((userId): userId is string => !!userId);
  const assignedUsers = await loadAssignedUsers(
    companyId,
    [...new Set(assignedUserIds)],
  );

  const contactsById = new Map(
    (contactsResult.data ?? []).map((contact) => [contact.id, contact]),
  );
  const notesByDeal = new Map<string, NoteItem[]>();

  for (const note of notesResult.data ?? []) {
    const noteList = notesByDeal.get(note.deal_id) ?? [];
    noteList.push(toNoteItem(note));
    notesByDeal.set(note.deal_id, noteList);
  }

  const cardsByStage = new Map<string, Stage["cards"]>();

  for (const deal of deals) {
    const contact = contactsById.get(deal.contact_id);

    if (!contact) {
      continue;
    }

    const stageCards = cardsByStage.get(deal.stage_id) ?? [];
    stageCards.push(
      buildCard(
        deal,
        contact,
        notesByDeal.get(deal.id) ?? [],
        assignedUsers,
      ),
    );
    cardsByStage.set(deal.stage_id, stageCards);
  }

  return {
    stages: stages.map((stage) => ({
      cards: cardsByStage.get(stage.id) ?? [],
      id: stage.id,
      name: stage.name,
      position: stage.position,
    })),
  };
}

export async function createContactWithDeal(companyId: string, values: ContactSchema) {
  const admin = getAdminClient();
  const phoneNormalized = normalizePhone(values.phone);
  await ensureDuplicatePhoneAvailable(companyId, phoneNormalized);
  await loadCompanyStage(companyId, values.stageId);

  const contactInsert: TableInsert<"contacts"> = {
    company_id: companyId,
    email: normalizeOptionalText(values.email),
    name: values.name.trim(),
    origin: normalizeOptionalText(values.origin),
    phone: values.phone.trim(),
    phone_normalized: phoneNormalized,
  };

  const { data: contact, error: contactError } = await admin
    .from("contacts")
    .insert(contactInsert)
    .select("*")
    .single();

  throwIfError(contactError);
  const savedContact = requireData(contact, "O contato foi criado sem retorno valido.");

  const dealInsert: TableInsert<"deals"> = {
    company_id: companyId,
    contact_id: savedContact.id,
    stage_id: values.stageId,
  };

  const { data: deal, error: dealError } = await admin
    .from("deals")
    .insert(dealInsert)
    .select("*")
    .single();

  throwIfError(dealError);
  const savedDeal = requireData(deal, "O negocio foi criado sem retorno valido.");

  return buildCard(savedDeal, savedContact, [], new Map());
}

export async function updateContact(companyId: string, dealId: string, values: UpdateContactSchema) {
  const admin = getAdminClient();
  const deal = await loadCompanyDeal(companyId, dealId);
  const contact = await loadCompanyContact(companyId, deal.contact_id);
  const phoneNormalized = normalizePhone(values.phone);

  await ensureDuplicatePhoneAvailable(companyId, phoneNormalized, contact.id);

  const update: TableUpdate<"contacts"> = {
    email: normalizeOptionalText(values.email),
    name: values.name.trim(),
    origin: normalizeOptionalText(values.origin),
    phone: values.phone.trim(),
    phone_normalized: phoneNormalized,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("contacts")
    .update(update)
    .eq("id", contact.id)
    .eq("company_id", companyId)
    .select("*")
    .single();

  throwIfError(error);
  const updatedContact = requireData(data, "Contato atualizado sem retorno valido.");

  return {
    created_at: updatedContact.created_at,
    email: updatedContact.email,
    id: updatedContact.id,
    name: updatedContact.name,
    origin: updatedContact.origin,
    phone: updatedContact.phone,
    phone_normalized: updatedContact.phone_normalized,
    updated_at: updatedContact.updated_at,
  };
}

export async function moveDeal(companyId: string, dealId: string, stageId: string) {
  const admin = getAdminClient();
  await loadCompanyStage(companyId, stageId);
  const movedAt = new Date().toISOString();

  const { data, error } = await admin
    .from("deals")
    .update({
      moved_at: movedAt,
      stage_id: stageId,
    })
    .eq("company_id", companyId)
    .eq("id", dealId)
    .select("*")
    .single();

  throwIfError(error);
  const updatedDeal = requireData(data, "Negociacao atualizada sem retorno valido.");

  return {
    movedAt: updatedDeal.moved_at,
    stageId: updatedDeal.stage_id,
  };
}

export async function assignDeal(
  companyId: string,
  dealId: string,
  assignedUserId: string | null,
) {
  const admin = getAdminClient();

  if (assignedUserId) {
    const { data, error } = await admin
      .from("company_users")
      .select("*")
      .eq("company_id", companyId)
      .eq("auth_user_id", assignedUserId)
      .eq("status", "active")
      .maybeSingle();

    throwIfError(error);

    if (!data) {
      throw new Error("Usuario selecionado nao esta ativo nesta empresa.");
    }
  }

  const { data, error } = await admin
    .from("deals")
    .update({
      assigned_user_id: assignedUserId,
    })
    .eq("company_id", companyId)
    .eq("id", dealId)
    .select("*")
    .single();

  throwIfError(error);
  const updatedDeal = requireData(data, "Negociacao atualizada sem retorno valido.");

  if (!updatedDeal.assigned_user_id) {
    return null;
  }

  const assignedUser = await loadAssignedUsers(companyId, [updatedDeal.assigned_user_id]);
  return assignedUser.get(updatedDeal.assigned_user_id) ?? null;
}

export async function addNote(
  companyId: string,
  dealId: string,
  values: NoteSchema,
  author: {
    authUserId: string;
    isSuperadmin: boolean;
    name: string;
  },
) {
  const admin = getAdminClient();
  await loadCompanyDeal(companyId, dealId);

  const insert: TableInsert<"notes"> = {
    author_name: author.name,
    author_user_id: author.isSuperadmin ? null : author.authUserId,
    body: values.body.trim(),
    deal_id: dealId,
  };

  const { data, error } = await admin
    .from("notes")
    .insert(insert)
    .select("*")
    .single();

  throwIfError(error);
  return toNoteItem(requireData(data, "Observacao criada sem retorno valido."));
}

export async function saveStages(companyId: string, drafts: StageDraftSchema[]) {
  const admin = getAdminClient();
  const { data: existingStages, error: existingStagesError } = await admin
    .from("stages")
    .select("*")
    .eq("company_id", companyId)
    .order("position");

  throwIfError(existingStagesError);

  const currentStageIds = new Set((existingStages ?? []).map((stage) => stage.id));
  const nextExistingIds = new Set(
    drafts.filter((draft) => !draft.isNew).map((draft) => draft.id),
  );
  const deletedStageIds = (existingStages ?? [])
    .filter((stage) => !nextExistingIds.has(stage.id))
    .map((stage) => stage.id);

  for (const stageId of deletedStageIds) {
    const { count, error: dealCountError } = await admin
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("stage_id", stageId);

    throwIfError(dealCountError);

    if ((count ?? 0) > 0) {
      throw new Error("Mova os cards antes de remover esta etapa.");
    }

    const { error } = await admin
      .from("stages")
      .delete()
      .eq("company_id", companyId)
      .eq("id", stageId);

    throwIfError(error);
  }

  for (const draft of drafts.filter((item) => currentStageIds.has(item.id))) {
    const { error } = await admin
      .from("stages")
      .update({
        name: draft.name.trim(),
        position: draft.position,
      })
      .eq("company_id", companyId)
      .eq("id", draft.id);

    throwIfError(error);
  }

  for (const draft of drafts.filter((item) => item.isNew)) {
    const { error } = await admin.from("stages").insert({
      company_id: companyId,
      name: draft.name.trim(),
      position: draft.position,
    });

    throwIfError(error);
  }

  const { data, error } = await admin
    .from("stages")
    .select("*")
    .eq("company_id", companyId)
    .order("position");

  throwIfError(error);

  return (data ?? []).map((stage) => ({
    cards: [],
    id: stage.id,
    name: stage.name,
    position: stage.position,
  }));
}

export async function listCompanyMembers(companyId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("company_users")
    .select("*")
    .eq("company_id", companyId)
    .eq("role", "member")
    .neq("status", "deleted")
    .order("name");

  throwIfError(error);

  return (data ?? []).map((user) => ({
    ...toCompanyUserSummary(user),
    id: user.id,
  })) satisfies UserManagementItem[];
}

export async function createMember(companyId: string, values: MemberCreateSchema) {
  const createdUser = await createAuthUser({
    email: values.email.trim(),
    name: values.name.trim(),
    password: values.password,
    role: "member",
    status: "active",
  });

  try {
    const user = await createCompanyUserRow(companyId, createdUser.id, {
      email: values.email.trim(),
      name: values.name.trim(),
      password: values.password,
      role: "member",
      status: "active",
    });

    return {
      ...toCompanyUserSummary(user),
      id: user.id,
    } satisfies UserManagementItem;
  } catch (error) {
    await deleteAuthUser(createdUser.id);
    throw error;
  }
}

export async function updateMember(
  companyId: string,
  companyUserId: string,
  values: MemberUpdateSchema,
) {
  const admin = getAdminClient();
  const companyUser = await ensureCompanyUser(companyId, companyUserId);

  if (companyUser.role !== "member") {
    throw new Error("Este modulo permite editar apenas usuarios comuns.");
  }

  await updateAuthUser(companyUser.auth_user_id, {
    email: values.email.trim(),
    name: values.name.trim(),
    password: values.password?.trim() || undefined,
  });

  const update: TableUpdate<"company_users"> = {
    email: values.email.trim(),
    name: values.name.trim(),
    status: values.status,
  };

  const { data, error } = await admin
    .from("company_users")
    .update(update)
    .eq("company_id", companyId)
    .eq("id", companyUserId)
    .select("*")
    .single();

  throwIfError(error);
  const updatedUser = requireData(data, "Usuario atualizado sem retorno valido.");

  return {
    ...toCompanyUserSummary(updatedUser),
    id: updatedUser.id,
  } satisfies UserManagementItem;
}

export async function softDeleteMember(companyId: string, companyUserId: string) {
  const admin = getAdminClient();
  const companyUser = await ensureCompanyUser(companyId, companyUserId);

  if (companyUser.role !== "member") {
    throw new Error("Este modulo permite excluir apenas usuarios comuns.");
  }

  const { error } = await admin
    .from("company_users")
    .update({
      status: "deleted",
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId)
    .eq("id", companyUserId);

  throwIfError(error);
}

export async function listCompanies() {
  const admin = getAdminClient();
  const [companiesResult, usersResult] = await Promise.all([
    admin.from("companies").select("*").order("name"),
    admin.from("company_users").select("*").neq("status", "deleted"),
  ]);

  throwIfError(companiesResult.error);
  throwIfError(usersResult.error);

  const usersByCompany = new Map<string, CompanyUserRow[]>();

  for (const user of usersResult.data ?? []) {
    const userList = usersByCompany.get(user.company_id) ?? [];
    userList.push(user);
    usersByCompany.set(user.company_id, userList);
  }

  return (companiesResult.data ?? []).map((company) => {
    const users = usersByCompany.get(company.id) ?? [];
    const adminCount = users.filter((user) => user.role === "admin").length;
    const memberCount = users.filter((user) => user.role === "member").length;

    return {
      ...toCompanySummary(company),
      adminCount,
      memberCount,
      totalUsers: users.length,
    } satisfies CompanyListItem;
  });
}

export async function getCompanyDetail(companyId: string) {
  const admin = getAdminClient();
  const [companyResult, usersResult] = await Promise.all([
    admin.from("companies").select("*").eq("id", companyId).maybeSingle(),
    admin
      .from("company_users")
      .select("*")
      .eq("company_id", companyId)
      .neq("status", "deleted")
      .order("role", { ascending: true })
      .order("name"),
  ]);

  throwIfError(companyResult.error);
  throwIfError(usersResult.error);

  if (!companyResult.data) {
    throw new Error("Empresa nao encontrada.");
  }

  return {
    company: toCompanySummary(companyResult.data),
    users: (usersResult.data ?? []).map((user) => ({
      ...toCompanyUserSummary(user),
      id: user.id,
    })),
  };
}

export async function createCompany(values: CompanyCreateSchema) {
  const admin = getAdminClient();
  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      name: values.name.trim(),
      status: "active",
    })
    .select("*")
    .single();

  throwIfError(companyError);
  const savedCompany = requireData(company, "Empresa criada sem retorno valido.");

  const createdAuthIds: string[] = [];

  try {
    await seedCompanyStages(savedCompany.id);

    for (const user of values.users) {
      const authUser = await createAuthUser({
        email: user.email.trim(),
        name: user.name.trim(),
        password: user.password,
        role: user.role,
        status: user.status,
      });

      createdAuthIds.push(authUser.id);
      await createCompanyUserRow(savedCompany.id, authUser.id, {
        email: user.email.trim(),
        name: user.name.trim(),
        password: user.password,
        role: user.role,
        status: user.status,
      });
    }

    return toCompanySummary(savedCompany);
  } catch (error) {
    for (const authUserId of createdAuthIds) {
      await deleteAuthUser(authUserId).catch(() => undefined);
    }

    await admin.from("companies").delete().eq("id", savedCompany.id);
    throw error;
  }
}

export async function updateCompany(companyId: string, values: CompanyUpdateSchema) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("companies")
    .update({
      name: values.name.trim(),
      status: values.status,
    })
    .eq("id", companyId)
    .select("*")
    .single();

  throwIfError(error);
  return toCompanySummary(requireData(data, "Empresa atualizada sem retorno valido."));
}

export async function createCompanyUser(
  companyId: string,
  input: CreateUserInput,
) {
  const authUser = await createAuthUser(input);

  try {
    const user = await createCompanyUserRow(companyId, authUser.id, input);
    return {
      ...toCompanyUserSummary(user),
      id: user.id,
    };
  } catch (error) {
    await deleteAuthUser(authUser.id);
    throw error;
  }
}

export async function updateCompanyUser(
  companyId: string,
  companyUserId: string,
  input: {
    email: string;
    name: string;
    password?: string;
    role: CompanyUserRow["role"];
    status: CompanyUserRow["status"];
  },
) {
  const admin = getAdminClient();
  const user = await ensureCompanyUser(companyId, companyUserId);

  if (
    user.role === "admin" &&
    (input.role !== "admin" || input.status !== "active")
  ) {
    const remainingAdmins = await countActiveAdmins(companyId, user.id);

    if (remainingAdmins < 1) {
      throw new Error("A empresa precisa manter ao menos um admin ativo.");
    }
  }

  await updateAuthUser(user.auth_user_id, {
    email: input.email.trim(),
    name: input.name.trim(),
    password: input.password,
  });

  const { data, error } = await admin
    .from("company_users")
    .update({
      email: input.email.trim(),
      name: input.name.trim(),
      role: input.role,
      status: input.status,
    })
    .eq("company_id", companyId)
    .eq("id", companyUserId)
    .select("*")
    .single();

  throwIfError(error);
  const updatedUser = requireData(data, "Usuario atualizado sem retorno valido.");

  return {
    ...toCompanyUserSummary(updatedUser),
    id: updatedUser.id,
  };
}

export async function softDeleteCompanyUser(companyId: string, companyUserId: string) {
  const admin = getAdminClient();
  const user = await ensureCompanyUser(companyId, companyUserId);

  if (user.role === "admin") {
    const remainingAdmins = await countActiveAdmins(companyId, user.id);

    if (remainingAdmins < 1) {
      throw new Error("A empresa precisa manter ao menos um admin ativo.");
    }
  }

  const { error } = await admin
    .from("company_users")
    .update({
      status: "deleted",
    })
    .eq("company_id", companyId)
    .eq("id", companyUserId);

  throwIfError(error);
}
