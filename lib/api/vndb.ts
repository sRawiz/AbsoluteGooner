import { cacheLife, cacheTag } from "next/cache";

export interface VNDBVisualNovel {
  id: string;
  title: string;
  image: { url: string } | null;
  rating: number;
}

export interface VNDBDetails {
  id: string;
  title: string;
  image: { url: string } | null;
  rating: number;
  description: string | null;
  released: string | null;
  developers: { name: string }[];
  length_minutes: number | null;
  tags?: { id: string; name: string; rating: number; spoiler: number }[];
  staff?: { id: string; name: string; role: string; note: string | null }[];
  aliases?: string[];
  languages?: string[];
  platforms?: string[];
  screenshots?: { url: string }[];
  relations?: { id: string; relation: string; title: string }[];
  extlinks?: { url: string; label: string; name: string }[];
}

export interface VNDBCharacter {
  id: string;
  name: string;
  original: string | null;
  image: { url: string } | null;
  blood_type: string | null;
  vns: { role: string }[];
}

const VNDB_API = "https://api.vndb.org/kana";

/** Shared fetch helper — always no-store inside 'use cache' functions */
async function vndbPost(endpoint: string, body: unknown): Promise<Response> {
  return fetch(`${VNDB_API}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store", // 'use cache' directive handles caching — disable fetch-level cache
    signal: AbortSignal.timeout(8000), // abort after 8s to prevent VNDB from hard-aborting us
  });
}

export async function getPopularVNs(limit: number = 10): Promise<VNDBVisualNovel[]> {
  "use cache";
  cacheTag("popular-vns");
  cacheLife("hours");

  try {
    const res = await vndbPost("vn", {
      // Filter by minimum rating + explicit results cap — prevents full-table sort that causes VNDB to abort
      filters: ["and", ["rating", ">=", 70], ["votecount", ">=", 100]],
      fields: "title, image.url, rating",
      sort: "rating",
      reverse: true,
      results: limit,
      count: false,
    });

    if (!res.ok) throw new Error(`Failed to fetch VNDB: ${res.statusText}`);
    const data = await res.json();
    return (data.results as VNDBVisualNovel[]) || [];
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.warn("VNDB popular VNs request timed out — returning empty array");
      return [];
    }
    console.error("Error fetching popular VNs:", error);
    return [];
  }
}

export async function getVNDetails(id: string): Promise<VNDBDetails | null> {
  "use cache";
  cacheTag("vn-details", `vn-${id}`);
  cacheLife("hours");

  try {
    const res = await vndbPost("vn", {
      filters: ["id", "=", id],
      fields:
        "title, image.url, rating, description, released, developers.name, length_minutes, tags.rating, tags.spoiler, tags.name, staff.name, staff.role, staff.note, aliases, languages, platforms, screenshots.url, relations.relation, relations.title, relations.id, extlinks.url, extlinks.label, extlinks.name",
    });

    if (!res.ok) throw new Error(`Failed to fetch VNDB details: ${res.statusText}`);
    const data = await res.json();
    return (data.results?.[0] as VNDBDetails) || null;
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.warn(`VNDB details timeout for ${id}`);
      return null;
    }
    console.error(`Error fetching VN details for ID ${id}:`, error);
    return null;
  }
}

export async function getVNDetailsBatch(ids: string[]): Promise<VNDBDetails[]> {
  "use cache";
  cacheTag("vn-details-batch");
  cacheLife("hours");

  if (!ids || ids.length === 0) return [];
  try {
    const res = await vndbPost("vn", {
      filters: ["id", "in", ids],
      fields:
        "title, image.url, rating, description, released, developers.name, length_minutes",
    });

    if (!res.ok) throw new Error(`Failed to fetch VNDB details batch: ${res.statusText}`);
    const data = await res.json();
    return (data.results as VNDBDetails[]) || [];
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.warn(`VNDB batch details timeout for IDs: ${ids.join(", ")}`);
      return [];
    }
    console.error(`Error fetching VN details batch for IDs ${ids.join(", ")}:`, error);
    return [];
  }
}

export async function searchVNs(query: string): Promise<VNDBDetails[]> {
  "use cache";
  // Tag by group + specific query — allows both broad and targeted invalidation
  cacheTag("search-vns", `search-vns-${encodeURIComponent(query.toLowerCase().trim())}`);
  cacheLife("minutes");

  if (!query) return [];
  try {
    const res = await vndbPost("vn", {
      filters: ["search", "=", query],
      fields:
        "title, image.url, rating, description, released, developers.name, length_minutes",
      results: 12,
    });

    if (!res.ok) throw new Error(`Failed to search VNDB: ${res.statusText}`);
    const data = await res.json();
    return (data.results as VNDBDetails[]) || [];
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.warn(`VNDB search timeout for query: "${query}"`);
      return [];
    }
    console.error(`Error searching VNs for query "${query}":`, error);
    return [];
  }
}

export async function getVNCharacters(vnId: string): Promise<VNDBCharacter[]> {
  "use cache";
  cacheTag("vn-characters", `vn-chars-${vnId}`);
  cacheLife("hours");

  try {
    const res = await vndbPost("character", {
      filters: ["vn", "=", ["id", "=", vnId]],
      fields: "name, original, image.url, blood_type, vns.role",
      results: 20,
    });
    if (!res.ok) throw new Error(`Failed to fetch characters: ${res.statusText}`);
    const data = await res.json();
    return (data.results as VNDBCharacter[]) || [];
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.warn(`VNDB characters timeout for VN: ${vnId}`);
      return [];
    }
    console.error(`Error fetching VN characters for ${vnId}:`, error);
    return [];
  }
}

export async function getVNCatalog(
  page: number,
  tagIds?: string[]
): Promise<{ data: VNDBDetails[]; pagination: { has_next_page: boolean } }> {
  "use cache";
  cacheTag("vn-catalog");
  cacheLife("hours");

  try {
    // Filter by rating + votecount to reduce scan size — VNDB aborts queries > 3s
    const ratingFilter = ["and", ["rating", ">=", 50], ["votecount", ">=", 20]];
    const filters: unknown[] =
      tagIds && tagIds.length > 0
        ? ["and", ratingFilter, ...tagIds.map((tag) => ["tag", "=", tag])]
        : ratingFilter;

    const res = await vndbPost("vn", {
      filters,
      fields: "title, image.url, rating, released, developers.name, length_minutes",
      sort: "rating",
      reverse: true,
      results: 24,
      page,
      count: false,
    });

    if (!res.ok) throw new Error(`Failed to fetch VN catalog: ${res.statusText}`);
    const data = await res.json();
    return {
      data: (data.results as VNDBDetails[]) || [],
      pagination: { has_next_page: data.more || false },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.warn("VNDB catalog timeout");
      return { data: [], pagination: { has_next_page: false } };
    }
    console.error("Error fetching VN catalog:", error);
    return { data: [], pagination: { has_next_page: false } };
  }
}
