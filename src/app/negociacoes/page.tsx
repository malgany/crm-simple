import { redirect } from "next/navigation";
import { KanbanPage } from "@/components/kanban/kanban-page";
import { loadBoardData } from "@/lib/board-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NegotiationsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const board = await loadBoardData(supabase);

  return <KanbanPage initialStages={board.stages} userEmail={user.email ?? ""} />;
}
