import { Suspense } from "react";
import { searchAnime } from "@/lib/api/jikan";
import { searchVNs } from "@/lib/api/vndb";
import { MediaCard } from "@/components/media-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

type SearchParams = Promise<{ q?: string }>;
type Props = { searchParams: SearchParams };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search",
    description: q
      ? `Search results for "${q}" — anime and visual novels.`
      : "Search the AbsGOONER database.",
  };
}

// ─── Inner async component — awaits searchParams INSIDE Suspense ───────────
async function SearchResults({ searchParams }: { searchParams: SearchParams }) {
  // ✅ await inside Suspense boundary
  const { q } = await searchParams;
  const query = q || "";

  if (!query) return null; // handled by shell

  const [animeResults, vnResults] = await Promise.all([
    searchAnime(query),
    searchVNs(query),
  ]);

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground">
        Found {animeResults.length} anime and {vnResults.length} visual novels.
      </p>

      <Tabs defaultValue={animeResults.length > 0 ? "anime" : "vn"} className="w-full">
        <TabsList className="mb-8 bg-card border border-border/50 shadow-sm">
          <TabsTrigger value="anime" className="text-base px-6">
            Anime ({animeResults.length})
          </TabsTrigger>
          <TabsTrigger value="vn" className="text-base px-6">
            Visual Novels ({vnResults.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anime" className="space-y-6 animate-in fade-in-50 duration-500">
          {animeResults.length === 0 ? (
            <div className="py-20 text-center border border-dashed rounded-xl border-border/50 bg-muted/20">
              <p className="text-muted-foreground">
                No anime found matching &ldquo;{query}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {animeResults.map((anime, index) => (
                <MediaCard
                  key={`anime-${anime.mal_id}`}
                  href={`/anime/${anime.mal_id}`}
                  title={anime.title}
                  imageUrl={anime.images.jpg.large_image_url}
                  rating={anime.score}
                  priority={index < 4}
                  variant="card"
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vn" className="space-y-6 animate-in fade-in-50 duration-500">
          {vnResults.length === 0 ? (
            <div className="py-20 text-center border border-dashed rounded-xl border-border/50 bg-muted/20">
              <p className="text-muted-foreground">
                No visual novels found matching &ldquo;{query}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {vnResults.map((vn, index) => (
                <MediaCard
                  key={`vn-${vn.id}`}
                  href={`/vn/${vn.id}`}
                  title={vn.title}
                  imageUrl={vn.image?.url}
                  rating={vn.rating}
                  ratingDivideByTen
                  priority={index < 4}
                  variant="card"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Skeleton — ✅ shadcn <Skeleton> แทน animate-pulse div ────────────────
function SearchResultsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-5 w-52" />
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page shell — sync for empty state, async only for metadata ───────────
export default function SearchPage({ searchParams }: Props) {
  // We need to peek at the query to decide which shell to render.
  // Use React.use() to unwrap the Promise synchronously inside render.
  // Since this is a Server Component, we can use a trick: render both cases
  // and let the inner component decide, or do it async but minimal.
  return <SearchPageInner searchParams={searchParams} />;
}

// ─── Thin async wrapper just to check for empty query ─────────────────────
async function SearchPageInner({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q || "";

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Search Database</h1>
        <p className="text-muted-foreground">
          Type something in the search bar above to find anime and visual novels.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8 min-h-[80vh]">
      <h1 className="text-3xl font-extrabold tracking-tight">
        Search Results for &ldquo;{query}&rdquo;
      </h1>

      {/* ✅ API calls happen inside Suspense — heading renders immediately */}
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
