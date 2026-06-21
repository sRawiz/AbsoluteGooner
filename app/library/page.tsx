import { createClient } from "@/lib/server";
import { getAnimeDetails } from "@/lib/api/jikan";
import { getVNDetailsBatch } from "@/lib/api/vndb";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MediaCard } from "@/components/media-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LibraryStatus } from "@/app/actions/library";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Library",
  description: "Manage your anime and visual novel watchlist.",
};

const statusGroups: { id: LibraryStatus; label: string }[] = [
  { id: "playing", label: "Currently Watching/Playing" },
  { id: "planning", label: "Plan to Watch/Play" },
  { id: "completed", label: "Completed" },
  { id: "dropped", label: "Dropped" },
];

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: libraryItems } = await supabase
    .from("user_library")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const animeRows = libraryItems?.filter((i) => i.item_type === "anime") || [];
  const vnRows = libraryItems?.filter((i) => i.item_type === "vn") || [];

  const animeDetailsRaw = await Promise.all(animeRows.map((row) => getAnimeDetails(row.item_id)));
  const animeDetailsMap = new Map(
    animeDetailsRaw.filter(Boolean).map((a) => [a!.mal_id.toString(), a])
  );

  const vnIds = vnRows.map((row) => row.item_id);
  const vnDetailsRaw = await getVNDetailsBatch(vnIds);
  const vnDetailsMap = new Map(vnDetailsRaw.filter(Boolean).map((v) => [v.id, v]));

  const groupedAnime = statusGroups
    .map((group) => ({
      ...group,
      items: animeRows
        .filter((r) => r.status === group.id)
        .map((r) => ({ ...r, detail: animeDetailsMap.get(r.item_id) }))
        .filter((i) => i.detail),
    }))
    .filter((g) => g.items.length > 0);

  const groupedVN = statusGroups
    .map((group) => ({
      ...group,
      items: vnRows
        .filter((r) => r.status === group.id)
        .map((r) => ({ ...r, detail: vnDetailsMap.get(r.item_id) }))
        .filter((i) => i.detail),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8 min-h-[80vh]">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">My Library</h1>
        <p className="text-muted-foreground mt-2">
          Track all the anime you watch and the visual novels you read.
        </p>
      </div>

      <Tabs defaultValue="anime" className="w-full">
        <TabsList className="mb-8 bg-card border border-border/50 shadow-sm">
          <TabsTrigger value="anime" className="text-base px-6">
            Anime ({animeRows.length})
          </TabsTrigger>
          <TabsTrigger value="vn" className="text-base px-6">
            Visual Novels ({vnRows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anime" className="space-y-12 animate-in fade-in-50 duration-500">
          {groupedAnime.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl border-border/50 bg-muted/20">
              <p className="text-muted-foreground mb-4">No anime in your library yet.</p>
              <Link href="/" className="text-primary hover:underline font-medium">
                Browse Trending Anime
              </Link>
            </div>
          )}
          {groupedAnime.map((group) => (
            <div key={group.id} className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-border/50 pb-2 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full" />
                {group.label}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {group.items.map((item, index) => (
                  <MediaCard
                    key={item.id}
                    href={`/anime/${item.item_id}`}
                    title={item.detail!.title}
                    imageUrl={item.detail!.images.jpg.large_image_url}
                    priority={index < 4}
                    variant="card"
                  />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="vn" className="space-y-12 animate-in fade-in-50 duration-500">
          {groupedVN.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl border-border/50 bg-muted/20">
              <p className="text-muted-foreground mb-4">No visual novels in your library yet.</p>
              <Link href="/" className="text-primary hover:underline font-medium">
                Browse Popular VNs
              </Link>
            </div>
          )}
          {groupedVN.map((group) => (
            <div key={group.id} className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-border/50 pb-2 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full" />
                {group.label}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {group.items.map((item, index) => (
                  <MediaCard
                    key={item.id}
                    href={`/vn/${item.item_id}`}
                    title={item.detail!.title}
                    imageUrl={item.detail!.image?.url}
                    ratingDivideByTen
                    priority={index < 4}
                    variant="card"
                  />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
