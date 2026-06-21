import { getVNDetails, getVNCharacters } from "@/lib/api/vndb";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Users,
  Mic,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  Globe,
  Gamepad2,
} from "lucide-react";
import { FaWindows, FaApple, FaLinux, FaAndroid, FaPlaystation, FaXbox } from "react-icons/fa";
import { createClient } from "@/lib/server";
import { LibraryButton } from "@/components/library-button";
import { getLibraryStatus } from "@/lib/queries";
import { parseBBCode } from "@/lib/utils";
import { RatingBadge } from "@/components/rating-badge";
import * as Flags from "country-flag-icons/react/3x2";
import { cache } from "react";
import type { Metadata } from "next";

// ─── Module-level constants (not inside JSX/IIFE) ────────────────────────────

const RELATION_MAP: Record<string, string> = {
  seq: "Sequel",
  pre: "Prequel",
  set: "Same Setting",
  alt: "Alternative Version",
  fan: "Fandisc",
  side: "Side Story",
  par: "Parent Story",
  ser: "Shares Characters",
};

type PlatformEntry = { label: string; Icon: React.ElementType; color?: string };

const PLATFORM_MAP: Record<string, PlatformEntry> = {
  win: { label: "Windows", Icon: FaWindows, color: "text-[#00A4EF]" },
  mac: { label: "macOS", Icon: FaApple, color: "text-primary" },
  lin: { label: "Linux", Icon: FaLinux, color: "text-[#FCC624]" },
  ios: { label: "iOS", Icon: FaApple, color: "text-primary" },
  and: { label: "Android", Icon: FaAndroid, color: "text-[#3DDC84]" },
  ps1: { label: "PS1", Icon: FaPlaystation, color: "text-[#003791]" },
  ps2: { label: "PS2", Icon: FaPlaystation, color: "text-[#003791]" },
  ps3: { label: "PS3", Icon: FaPlaystation, color: "text-[#003791]" },
  ps4: { label: "PS4", Icon: FaPlaystation, color: "text-[#003791]" },
  ps5: { label: "PS5", Icon: FaPlaystation, color: "text-[#003791]" },
  psp: { label: "PSP", Icon: FaPlaystation, color: "text-[#003791]" },
  psv: { label: "PS Vita", Icon: FaPlaystation, color: "text-[#003791]" },
  xb1: { label: "Xbox", Icon: FaXbox, color: "text-[#107C10]" },
  xb3: { label: "Xbox 360", Icon: FaXbox, color: "text-[#107C10]" },
  xbs: { label: "Xbox Series", Icon: FaXbox, color: "text-[#107C10]" },
  swi: { label: "Nintendo Switch", Icon: Gamepad2, color: "text-[#E60012]" },
  wii: { label: "Wii", Icon: Gamepad2, color: "text-[#E60012]" },
  n3d: { label: "Nintendo 3DS", Icon: Gamepad2, color: "text-[#E60012]" },
  nds: { label: "Nintendo DS", Icon: Gamepad2, color: "text-[#E60012]" },
  web: { label: "Browser", Icon: Globe, color: "text-blue-500" },
};

const LANG_TO_COUNTRY: Record<string, keyof typeof Flags> = {
  ja: "JP",
  en: "GB",
  "zh-Hans": "CN",
  "zh-Hant": "TW",
  ko: "KR",
  es: "ES",
  ru: "RU",
  fr: "FR",
  de: "DE",
  it: "IT",
  "pt-BR": "BR",
  "pt-PT": "PT",
  vi: "VN",
  th: "TH",
  ar: "SA",
  pl: "PL",
  id: "ID",
  tr: "TR",
  uk: "UA",
};

const LANG_NAMES: Record<string, string> = {
  ja: "Japanese",
  en: "English",
  "zh-Hans": "Chinese (Simp.)",
  "zh-Hant": "Chinese (Trad.)",
  ko: "Korean",
  es: "Spanish",
  ru: "Russian",
  fr: "French",
  de: "German",
  it: "Italian",
  "pt-BR": "Portuguese (BR)",
  "pt-PT": "Portuguese",
  vi: "Vietnamese",
  th: "Thai",
  ar: "Arabic",
  pl: "Polish",
  id: "Indonesian",
  tr: "Turkish",
  uk: "Ukrainian",
};

const STORE_KEYWORDS = [
  "steam",
  "gog",
  "epic",
  "dlsite",
  "dmm",
  "jast",
  "mangagamer",
  "nintendo",
  "playstation",
  "xbox",
  "appstore",
  "google play",
  "store",
  "itch.io",
];
const WIKI_KEYWORDS = ["wiki", "db", "mobygames", "gamefaqs", "howlongtobeat", "igdb", "vndb"];

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ id: string }> };
type ExtLink = { url: string; label: string; name: string };

// ─── Sub-components ───────────────────────────────────────────────────────────

function LinkGroup({ title, links }: { title: string; links: ExtLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
        {title}
      </p>
      <div className="flex flex-col gap-1">
        {links.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline line-clamp-1 flex items-center gap-1 text-[13px]"
            title={link.url}
          >
            <LinkIcon className="size-3 shrink-0" />
            <span className="truncate">{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

// cache() deduplicates between generateMetadata and the page component
const getCachedVN = cache((id: string) => getVNDetails(id));

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vn = await getCachedVN(id);
  if (!vn) return { title: "Not Found" };
  return {
    title: vn.title,
    description: vn.description
      ? vn.description.replace(/\[.*?\]/g, "").slice(0, 160)
      : `${vn.title} — Visual Novel`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VNDetailPage({ params }: Props) {
  const { id } = await params;

  const [vn, characters] = await Promise.all([getCachedVN(id), getVNCharacters(id)]);

  if (!vn) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const libraryStatus = user
    ? await getLibraryStatus(supabase, user.id, id, "vn")
    : null;

  // Filter tags: no spoilers, rating > 1.5, top 15
  const topTags =
    vn.tags
      ?.filter((t) => t.spoiler === 0 && t.rating > 1.5)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 15) || [];

  // Categorise external links
  const stores: ExtLink[] = [];
  const wikis: ExtLink[] = [];
  const others: ExtLink[] = [];
  vn.extlinks?.forEach((link) => {
    const lower = (link.label + " " + link.name).toLowerCase();
    if (STORE_KEYWORDS.some((kw) => lower.includes(kw))) stores.push(link);
    else if (WIKI_KEYWORDS.some((kw) => lower.includes(kw))) wikis.push(link);
    else others.push(link);
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner */}
      <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden bg-muted">
        {vn.screenshots?.[0]?.url ? (
          <Image
            src={vn.screenshots[0].url}
            alt={vn.title}
            fill
            className="object-cover blur-sm opacity-40"
            priority
          />
        ) : vn.image?.url ? (
          <Image
            src={vn.image.url}
            alt={vn.title}
            fill
            className="object-cover blur-xl opacity-30"
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-8 -mt-32 relative z-10 flex flex-col md:flex-row gap-8 pb-12">
        {/* Left Column — Poster + Info */}
        <div className="w-full md:w-1/3 lg:w-1/4 shrink-0 max-w-[300px] mx-auto md:mx-0">
          <div className="aspect-[3/4] relative rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-muted flex items-center justify-center">
            {vn.image?.url ? (
              <Image
                src={vn.image.url}
                alt={vn.title}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-cover"
                priority
              />
            ) : (
              <span className="text-muted-foreground">No Image Available</span>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <LibraryButton
              itemId={id}
              itemType="vn"
              initialStatus={libraryStatus}
              isLoggedIn={!!user}
            />
          </div>

          {/* Information sidebar */}
          <div className="mt-6 space-y-4 p-4 bg-card rounded-xl border border-border/50">
            <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
              <Info className="size-4 text-primary" /> Information
            </h3>

            <div className="space-y-3 text-sm">
              {vn.developers && vn.developers.length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground">Developers</p>
                  <p>{vn.developers.map((d) => d.name).join(", ")}</p>
                </div>
              )}
              {vn.released && (
                <div>
                  <p className="font-medium text-muted-foreground">Release Date</p>
                  <p>{vn.released}</p>
                </div>
              )}

              {/* Platforms */}
              {vn.platforms && vn.platforms.length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Platforms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vn.platforms.map((p) => {
                      const plat = PLATFORM_MAP[p] || { label: p.toUpperCase(), Icon: Globe };
                      const Icon = plat.Icon;
                      return (
                        <span
                          key={p}
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-secondary/40 border border-border/50 text-secondary-foreground px-2 py-0.5 rounded-sm"
                          title={plat.label}
                        >
                          <Icon className={`size-3.5 ${plat.color || ""}`} />
                          <span>{plat.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Languages */}
              {vn.languages && vn.languages.length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vn.languages.map((l) => {
                      const countryCode = LANG_TO_COUNTRY[l];
                      const FlagComponent = countryCode ? Flags[countryCode] : null;
                      const langName = LANG_NAMES[l] || l.toUpperCase();
                      return (
                        <span
                          key={l}
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-secondary/40 border border-border/50 text-secondary-foreground px-2 py-0.5 rounded-sm"
                          title={langName}
                        >
                          {FlagComponent ? (
                            <FlagComponent className="w-4 h-3 rounded-[2px] shadow-sm" />
                          ) : (
                            <Globe className="size-3 text-primary/80" />
                          )}
                          <span>{langName}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {vn.aliases && vn.aliases.length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground">Aliases</p>
                  <p className="line-clamp-3" title={vn.aliases.join("\n")}>
                    {vn.aliases.join(", ")}
                  </p>
                </div>
              )}

              {/* External Links */}
              {vn.extlinks && vn.extlinks.length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground border-t border-border/50 pt-2 mt-2">
                    External Links
                  </p>
                  <LinkGroup title="Stores" links={stores} />
                  <LinkGroup title="Information & Wikis" links={wikis} />
                  <LinkGroup title="Other Links" links={others} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column — Main Content */}
        <div className="flex-1 space-y-8 pt-4 md:pt-32 min-w-0">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{vn.title}</h1>

            <div className="flex flex-wrap items-center gap-3">
              {vn.rating && <RatingBadge score={vn.rating} divideByTen size="md" />}
              <Badge variant="outline" className="text-base px-3 py-1">
                Visual Novel
              </Badge>
              {vn.length_minutes && (
                <Badge variant="secondary" className="flex items-center gap-1 text-base px-3 py-1">
                  <Clock className="size-4" />
                  {~~(vn.length_minutes / 60)}h {vn.length_minutes % 60}m
                </Badge>
              )}
            </div>

            {topTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {topTags.map((tag) => (
                  <Link key={tag.id} href={`/vn?genre=${tag.id}`}>
                    <Badge
                      variant="secondary"
                      className="text-xs font-normal hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Overview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Overview</h2>
            {vn.description ? (
              <div
                className="text-muted-foreground leading-relaxed whitespace-pre-wrap [&>a]:text-primary [&>a]:underline"
                dangerouslySetInnerHTML={{ __html: parseBBCode(vn.description) }}
              />
            ) : (
              <div className="text-muted-foreground leading-relaxed">No description available.</div>
            )}
          </div>

          {/* Screenshots */}
          {vn.screenshots && vn.screenshots.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <ImageIcon className="size-5 text-primary" /> Screenshots
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vn.screenshots.slice(0, 6).map((shot, idx) => (
                  <div
                    key={idx}
                    className="aspect-video relative rounded-lg overflow-hidden border border-border/50 shadow-sm bg-muted group"
                  >
                    <Image
                      src={shot.url}
                      alt={`Screenshot ${idx + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Characters */}
          {characters.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Users className="size-5 text-primary" /> Characters
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {characters.map((char) => (
                  <div
                    key={char.id}
                    className="bg-card border border-border/50 rounded-lg overflow-hidden flex flex-col shadow-sm"
                  >
                    <div className="aspect-square relative bg-muted">
                      {char.image?.url ? (
                        <Image
                          src={char.image.url}
                          alt={char.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm line-clamp-1">{char.name}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-1">
                        {char.vns?.[0]?.role || "Unknown Role"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Staff */}
          {vn.staff && vn.staff.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Mic className="size-5 text-primary" /> Staff & Voice Actors
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vn.staff.slice(0, 10).map((person, idx) => (
                  <div
                    key={`${person.id}-${idx}`}
                    className="flex items-start gap-3 bg-card p-3 rounded-lg border border-border/50"
                  >
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary text-sm">
                        {person.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{person.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {person.role} {person.note ? `(${person.note})` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {vn.staff.length > 10 && (
                <p className="text-sm text-muted-foreground italic">
                  And {vn.staff.length - 10} more...
                </p>
              )}
            </div>
          )}

          {/* Related VNs */}
          {vn.relations && vn.relations.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <LinkIcon className="size-5 text-primary" /> Related Visual Novels
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vn.relations.map((rel) => (
                  <Link
                    href={`/vn/${rel.id}`}
                    key={rel.id}
                    className="flex flex-col p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
                      {RELATION_MAP[rel.relation] || rel.relation}
                    </p>
                    <p className="font-medium text-sm line-clamp-1">{rel.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
