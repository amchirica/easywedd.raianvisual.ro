"use server";

import { revalidatePath } from "next/cache";

import { setActiveWorkspaceId } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";

export async function switchWorkspaceAction(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Neautentificat" };
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .eq("invitation_status", "accepted")
    .maybeSingle();

  if (!membership) {
    return { error: "Nu ai acces la acest workspace." };
  }

  await setActiveWorkspaceId(workspaceId);
  revalidatePath("/dashboard");
  return { success: true };
}
