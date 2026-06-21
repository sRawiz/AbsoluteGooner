import { Suspense } from "react";
import { getVNCatalog } from "@/lib/api/vndb";
import { MediaCard } from "@/components/media-card";
import { FilterSidebar } from "@/components/filter-sidebar";
import { PaginationLinks } from "@/components/pagination-links";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Visual Novels",
  description: "Browse and filter the visual novel catalog by tag.",
};

const VN_TAGS = [
  { id: "g35", name: "Romance" },
  { id: "g162", name: "Sci-Fi" },
  { id: "g37", name: "Fantasy" },
  { id: "g41", name: "Comedy" },
  { id: "g171", name: "Drama" },
  { id: "g8", name: "Horror" },
  { id: "g164", name: "Mystery" },
  { id: "g170", name: "Slice of Life" },
];

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// ─── Inner async component — awaits searchParams INSIDE Suspense ───────────
async function VNPageContent({ searchParams }: { searchParams: SearchParams }) {
  // ✅ await happens inside Suspense boundary — does not block page shell
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) || 1 : 1;
  const genre = typeof params.genre === "string" ? params.genre : undefined;

  const tagIds = genre ? [genre] : undefined;
  const { data: vns, pagination } = await getVNCatalog(page, tagIds);

  // Deduplicate by id — defensive against potential VNDB duplicates
  const seen = new Set<string>();
  const uniqueVns = vns.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  const resolvedParams: Record<string, string> = {
    ...(genre ? { genre } : {}),
    ...(page > 1 ? { page: String(page) } : {}),
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <FilterSidebar
        title="Visual Novel Tags"
        options={VN_TAGS}
        currentValue={genre}
        baseUrl="/vn"
      />

      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-bold mb-6">Explore Visual Novels</h1>

        {uniqueVns.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No visual novels found for this category.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {uniqueVns.map((vn, index) => (
              <MediaCard
                key={vn.id}
                href={`/vn/${vn.id}`}
                title={vn.title}
                imageUrl={vn.image?.url}
                rating={vn.rating}
                ratingDivideByTen
                priority={index < 8}
                variant="overlay"
                badges={
                  <>
                    {vn.length_minutes && (
                      // ✅ Badge component แทน custom <span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-none flex items-center gap-1"
                      >
                        <Clock className="size-2.5" />
                        {~~(vn.length_minutes / 60)}h
                      </Badge>
                    )}
                    {vn.released && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {vn.released.substring(0, 4)}
                      </Badge>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}

        {pagination && (
          <PaginationLinks
            currentPage={page}
            hasNextPage={pagination.has_next_page}
            baseUrl="/vn"
            searchParams={resolvedParams}
          />
        )}
      </div>
    </div>
  );
}

// ─── Skeleton — ✅ ใช้ shadcn <Skeleton> แทน animate-pulse div ───────────
function VNPageSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-48 shrink-0 space-y-2 hidden md:block">
        <Skeleton className="h-6 w-36 mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <Skeleton className="h-9 w-56 mb-6" />
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
export default function VNExplorePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* ✅ searchParams Promise passed into Suspense — page shell is NOT async */}
      <Suspense fallback={<VNPageSkeleton />}>
        <VNPageContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
