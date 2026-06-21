import { Suspense } from "react";
import { getAnimeCatalog } from "@/lib/api/jikan";
import { MediaCard } from "@/components/media-card";
import { FilterSidebar } from "@/components/filter-sidebar";
import { PaginationLinks } from "@/components/pagination-links";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Anime",
  description: "Browse and filter the anime catalog by genre.",
};

const ANIME_GENRES = [
  { id: "1", name: "Action" },
  { id: "2", name: "Adventure" },
  { id: "4", name: "Comedy" },
  { id: "8", name: "Drama" },
  { id: "10", name: "Fantasy" },
  { id: "22", name: "Romance" },
  { id: "24", name: "Sci-Fi" },
  { id: "36", name: "Slice of Life" },
];

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// ─── Inner async component — awaits searchParams INSIDE Suspense ───────────
async function AnimePageContent({ searchParams }: { searchParams: SearchParams }) {
  // ✅ await happens inside Suspense boundary — does not block page shell
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) || 1 : 1;
  const genre = typeof params.genre === "string" ? params.genre : undefined;

  const { data: animes, pagination } = await getAnimeCatalog(page, genre);

  // Jikan occasionally returns duplicate mal_ids — deduplicate defensively
  const seen = new Set<number>();
  const uniqueAnimes = animes.filter((a) => {
    if (seen.has(a.mal_id)) return false;
    seen.add(a.mal_id);
    return true;
  });

  const resolvedParams: Record<string, string> = {
    ...(genre ? { genre } : {}),
    ...(page > 1 ? { page: String(page) } : {}),
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <FilterSidebar
        title="Anime Genres"
        options={ANIME_GENRES}
        currentValue={genre}
        baseUrl="/anime"
      />

      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-bold mb-6">Explore Anime</h1>

        {uniqueAnimes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No anime found for this category.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {uniqueAnimes.map((anime, index) => (
              <MediaCard
                key={anime.mal_id}
                href={`/anime/${anime.mal_id}`}
                title={anime.title}
                imageUrl={anime.images?.jpg?.large_image_url}
                rating={anime.score}
                priority={index < 8}
                variant="overlay"
                badges={anime.genres?.slice(0, 2).map((g) => (
                  // ✅ Badge component แทน custom <span>
                  <Badge
                    key={g.name}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-none"
                  >
                    {g.name}
                  </Badge>
                ))}
              />
            ))}
          </div>
        )}

        {pagination && (
          <PaginationLinks
            currentPage={page}
            hasNextPage={pagination.has_next_page}
            baseUrl="/anime"
            searchParams={resolvedParams}
          />
        )}
      </div>
    </div>
  );
}

// ─── Skeleton — ✅ ใช้ shadcn <Skeleton> แทน animate-pulse div ───────────
function AnimePageSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar skeleton */}
      <div className="w-48 shrink-0 space-y-2 hidden md:block">
        <Skeleton className="h-6 w-32 mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
      {/* Grid skeleton */}
      <div className="flex-1 min-w-0">
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page shell — sync, renders immediately, passes Promise to Suspense ────
export default function AnimeExplorePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* ✅ searchParams Promise passed into Suspense — page shell is NOT async */}
      <Suspense fallback={<AnimePageSkeleton />}>
        <AnimePageContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
