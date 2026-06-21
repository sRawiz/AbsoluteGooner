"use server";

import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";

export type LibraryStatus = 'planning' | 'playing' | 'completed' | 'dropped';
export type ItemType = 'anime' | 'vn';

export async function addOrUpdateLibraryItem(
  item_id: string,
  item_type: ItemType,
  status: LibraryStatus
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to manage your library." };
  }

  const { error } = await supabase
    .from('user_library')
    .upsert({
      user_id: user.id,
      item_id,
      item_type,
      status,
      // updated_at is managed by Postgres DEFAULT now() + trigger
    }, {
      onConflict: 'user_id, item_id, item_type'
    });

  if (error) {
    console.error("Error upserting library item:", error);
    return { success: false, error: "Failed to update library." };
  }

  // Revalidate the page to show new status
  revalidatePath(`/${item_type}/${item_id}`);
  return { success: true };
}

export async function removeLibraryItem(
  item_id: string,
  item_type: ItemType
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to manage your library." };
  }

  const { error } = await supabase
    .from('user_library')
    .delete()
    .match({ user_id: user.id, item_id, item_type });

  if (error) {
    console.error("Error deleting library item:", error);
    return { success: false, error: "Failed to remove from library." };
  }

  revalidatePath(`/${item_type}/${item_id}`);
  return { success: true };
}
