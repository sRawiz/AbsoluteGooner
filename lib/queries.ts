import { SupabaseClient } from "@supabase/supabase-js";
import { LibraryStatus, ItemType } from "@/app/actions/library";

/**
 * Fetches the current library status for a given item and user.
 * Returns null when the user is not logged in or the item is not in their library.
 *
 * Security: uses getUser() (validates JWT server-side), never getSession().
 *
 * Error handling:
 * - PGRST116 ("not found") is expected when the item isn't in the library — returns null.
 * - Any other Supabase error is logged and treated as null (fail-safe for UI).
 */
export async function getLibraryStatus(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
  itemType: ItemType
): Promise<LibraryStatus | null> {
  const { data, error } = await supabase
    .from("user_library")
    .select("status")
    .match({ user_id: userId, item_id: itemId, item_type: itemType })
    .single();

  if (error) {
    // PGRST116 = "The result contains 0 rows" — normal when item not in library
    if (error.code !== "PGRST116") {
      console.error("getLibraryStatus unexpected error:", error.code, error.message);
    }
    return null;
  }

  return data ? (data.status as LibraryStatus) : null;
}
