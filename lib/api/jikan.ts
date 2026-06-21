import { cacheLife, cacheTag } from "next/cache";

export interface JikanAnimeDetails {
  mal_id: number;
  title: string;
  images: { jpg: { large_image_url: string } };
  score: number;
  genres: { name: string }[];
  synopsis: string;
  episodes: number;
  studios: { name: string }[];
  trailer: { url: string; embed_url: string } | null;
  year: number | null;
  rating: string | null;
}

export interface JikanAnime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  score: number;
  genres: { name: string }[];
  synopsis: string;
  episodes: number;
}

const JIKAN_API = "https://api.jikan.moe/v4";

export async function getTrendingAnime(limit: number = 10): Promise<JikanAnime[]> {
  "use cache";
  cacheTag("trending-anime");
  cacheLife("hours");

  try {
    const res = await fetch(
      `${JIKAN_API}/top/anime?filter=bypopularity&limit=${limit}`,
      {
        cache: "no-store", // 'use cache' handles caching — disable fetch-level cache
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch trending anime: ${res.statusText}`);
    }

    const data = await res.json();
    return (data.data as JikanAnime[]) || [];
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.warn("Jikan trending anime request timed out");
      return [];
    }
    console.error("Error fetching trending anime:", error);
    return [];
  }
}

export async function getAnimeDetails(id: string): Promise<JikanAnimeDetails | null> {
  "use cache";
  cacheTag("anime-details", `anime-${id}`);
  cacheLife("hours");

  try {
    const res = await fetch(
      `${JIKAN_API}/anime/${id}/full`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch anime details: ${res.statusText}`);
    }

    const data = await res.json();
    return (data.data as JikanAnimeDetails) || null;
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.warn(`Jikan anime details timeout for ID: ${id}`);
      return null;
    }
    console.error(`Error fetching anime details for ID ${id}:`, error);
    return null;
  }
}

export async function getAnimeCatalog(
  page: number,
  genreId?: string
): Promise<{ data: JikanAnime[]; pagination: { has_next_page: boolean } }> {
  "use cache";
  cacheTag("anime-catalog");
  cacheLife("hours");

  try {
    const genreParam = genreId ? `&genres=${genreId}` : "";
    const res = await fetch(
      `${JIKAN_API}/anime?page=${page}&limit=24&order_by=popularity&sort=asc&sfw=true${genreParam}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch anime catalog: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      data: (data.data as JikanAnime[]) || [],
      pagination: (data.pagination as { has_next_page: boolean }) || { has_next_page: false },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.warn("Jikan anime catalog timeout");
      return { data: [], pagination: { has_next_page: false } };
    }
    console.error("Error fetching anime catalog:", error);
    return { data: [], pagination: { has_next_page: false } };
  }
}

export async function searchAnime(query: string): Promise<JikanAnime[]> {
  "use cache";
  // Tag by group + specific query — allows both broad and targeted invalidation
  cacheTag("search-anime", `search-anime-${encodeURIComponent(query.toLowerCase().trim())}`);
  cacheLife("minutes");

  try {
    const res = await fetch(
      `${JIKAN_API}/anime?q=${encodeURIComponent(query)}&sfw=true&limit=12`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );

    if (!res.ok) {
      throw new Error(`Failed to search anime: ${res.statusText}`);
    }

    const data = await res.json();
    return (data.data as JikanAnime[]) || [];
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.warn(`Jikan search timeout for query: "${query}"`);
      return [];
    }
    console.error(`Error searching anime for query "${query}":`, error);
    return [];
  }
}
