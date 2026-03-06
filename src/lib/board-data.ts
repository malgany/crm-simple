import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BoardData, ContactRecord, NoteItem, Stage } from "@/lib/app.types";
import type { Database, TableRow } from "@/lib/database.types";

type AppSupabaseClient = SupabaseClient<Database>;

function toNote(note: TableRow<"notes">): NoteItem {
  return {
    body: note.body,
    createdAt: note.created_at,
    dealId: note.deal_id,
    id: note.id,
  };
}

export async function loadBoardData(
  supabase: AppSupabaseClient,
): Promise<BoardData> {
  const [stagesResult, dealsResult] = await Promise.all([
    supabase.from("stages").select("*").order("position"),
    supabase.from("deals").select("*").order("moved_at", { ascending: false }),
  ]);

  if (stagesResult.error) {
    throw new Error(stagesResult.error.message);
  }

  if (dealsResult.error) {
    throw new Error(dealsResult.error.message);
  }

  const deals = dealsResult.data ?? [];
  const stageRows = stagesResult.data ?? [];
  const dealIds = deals.map((deal) => deal.id);
  const contactIds = deals.map((deal) => deal.contact_id);

  const [contactsResult, notesResult] = await Promise.all([
    contactIds.length
      ? supabase.from("contacts").select("*").in("id", contactIds)
      : Promise.resolve({ data: [], error: null }),
    dealIds.length
      ? supabase
          .from("notes")
          .select("*")
          .in("deal_id", dealIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (contactsResult.error) {
    throw new Error(contactsResult.error.message);
  }

  if (notesResult.error) {
    throw new Error(notesResult.error.message);
  }

  const contacts = new Map(
    (contactsResult.data ?? []).map((contact) => [contact.id, contact]),
  );
  const notesByDeal = new Map<string, NoteItem[]>();

  for (const note of notesResult.data ?? []) {
    const noteList = notesByDeal.get(note.deal_id) ?? [];
    noteList.push(toNote(note));
    notesByDeal.set(note.deal_id, noteList);
  }

  const cardsByStage = new Map<string, Stage["cards"]>();

  for (const deal of deals) {
    const contact = contacts.get(deal.contact_id) as ContactRecord | undefined;

    if (!contact) {
      continue;
    }

    const stageCards = cardsByStage.get(deal.stage_id) ?? [];
    stageCards.push({
      contact,
      createdAt: deal.created_at,
      id: deal.id,
      movedAt: deal.moved_at,
      notes: notesByDeal.get(deal.id) ?? [],
      stageId: deal.stage_id,
    });
    cardsByStage.set(deal.stage_id, stageCards);
  }

  const stages: Stage[] = stageRows.map((stage) => ({
    cards: (cardsByStage.get(stage.id) ?? []).sort(
      (left, right) =>
        new Date(right.movedAt).getTime() - new Date(left.movedAt).getTime(),
    ),
    id: stage.id,
    name: stage.name,
    position: stage.position,
  }));

  return { stages };
}
