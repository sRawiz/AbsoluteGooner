import { getAnimeDetails } from "@/lib/api/jikan";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { PlayCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/server";
import { LibraryButton } from "@/components/library-button";
import { getLibraryStatus } from "@/lib/queries";
import { RatingBadge } from "@/components/rating-badge";
import { cache } from "react";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

// cache() deduplicates the fetch between generateMetadata and the page component
const getCachedAnime = cache((id: string) => getAnimeDetails(id));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const anime = await getCachedAnime(id);
  if (!anime) return { title: "Not Found" };
  return {
    title: anime.title,
    description: anime.synopsis?.slice(0, 160),
  };
}

export default async function AnimeDetailPage({ params }: Props) {
  const { id } = await params;
  const anime = await getCachedAnime(id);

  if (!anime) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const libraryStatus = user
    ? await getLibraryStatus(supabase, user.id, id, "anime")
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner */}
      <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
        <Image
          src={anime.images.jpg.large_image_url}
          alt={anime.title}
          fill
          className="object-cover blur-xl opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-8 -mt-32 relative z-10 flex flex-col md:flex-row gap-8 pb-12">
        {/* Left Column — Poster */}
        <div className="w-full md:w-1/3 lg:w-1/4 shrink-0 max-w-[300px] mx-auto md:mx-0">
          <div className="aspect-[3/4] relative rounded-xl overflow-hidden shadow-2xl border border-border/50">
            <Image
              src={anime.images.jpg.large_image_url}
              alt={anime.title}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Right Column — Details */}
        <div className="flex-1 space-y-6 pt-4 md:pt-32">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{anime.title}</h1>

          <div className="flex flex-wrap items-center gap-3">
            {anime.score && <RatingBadge score={anime.score} size="md" />}
            {anime.year && (
              <Badge variant="outline" className="text-base px-3 py-1">
                {anime.year}
              </Badge>
            )}
            {anime.rating && (
              <Badge variant="outline" className="text-base px-3 py-1">
                {anime.rating}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {anime.genres.map((g) => (
              <Badge key={g.name} className="bg-primary/20 text-primary hover:bg-primary/30 border-none">
                {g.name}
              </Badge>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Synopsis</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {anime.synopsis || "No synopsis available."}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Studios</p>
              <p className="font-semibold">{anime.studios.map((s) => s.name).join(", ") || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Episodes</p>
              <p className="font-semibold">{anime.episodes || "Unknown"}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-6">
            <LibraryButton
              itemId={id}
              itemType="anime"
              initialStatus={libraryStatus}
              isLoggedIn={!!user}
            />

            {anime.trailer?.url && (
              <Link
                href={anime.trailer.url}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2")}
              >
                <PlayCircle className="size-5" />
                Watch Trailer
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
