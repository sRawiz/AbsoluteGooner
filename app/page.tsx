import { getTrendingAnime } from "@/lib/api/jikan";
import { getPopularVNs } from "@/lib/api/vndb";
import { MediaCard } from "@/components/media-card";

export default async function Home() {
  const [trendingAnime, popularVNs] = await Promise.all([
    getTrendingAnime(5),
    getPopularVNs(5),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background/80 to-background z-0" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />

        <div className="relative z-10 container px-4 md:px-6 text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">
            Discover Your Next <span className="text-primary">Obsession</span>
          </h1>
          <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
            The ultimate database for Anime and Visual Novels. Track, discover, and organize your
            favorites.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-8 py-12 space-y-16">
        {/* Trending Anime Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Trending Anime</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {trendingAnime.map((anime, index) => (
              <MediaCard
                key={`anime-${anime.mal_id}`}
                href={`/anime/${anime.mal_id}`}
                title={anime.title}
                imageUrl={anime.images.jpg.large_image_url}
                rating={anime.score}
                subLabel={anime.genres.map((g) => g.name).join(" • ")}
                priority={index < 4}
                variant="card"
              />
            ))}
          </div>
        </section>

        {/* Popular VNs Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Highest Rated Visual Novels</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {popularVNs.map((vn, index) => (
              <MediaCard
                key={`vn-${vn.id}`}
                href={`/vn/${vn.id}`}
                title={vn.title}
                imageUrl={vn.image?.url}
                rating={vn.rating}
                ratingDivideByTen
                subLabel="Visual Novel"
                priority={index < 4}
                variant="card"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
