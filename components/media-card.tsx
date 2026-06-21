import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { RatingBadge } from "@/components/rating-badge";

interface MediaCardProps {
  href: string;
  title: string;
  imageUrl?: string | null;
  /** Raw rating value */
  rating?: number | null;
  /** Divide rating by 10 (for VNDB) */
  ratingDivideByTen?: boolean;
  /** Sub-label shown below title in card variant */
  subLabel?: string;
  /** Image loading priority */
  priority?: boolean;
  /**
   * - `overlay`: image fills full card with gradient + text overlay (catalog style)
   * - `card`:    image on top, text below the image (home / search style)
   */
  variant?: "overlay" | "card";
  /** Extra content inside card variant's genre/tag area */
  badges?: React.ReactNode;
}

export function MediaCard({
  href,
  title,
  imageUrl,
  rating,
  ratingDivideByTen = false,
  subLabel,
  priority = false,
  variant = "overlay",
  badges,
}: MediaCardProps) {
  if (variant === "card") {
    return (
      <Link href={href}>
        <Card className="overflow-hidden group border-border/50 bg-card hover:border-primary/50 transition-colors cursor-pointer h-full">
          <div className="relative aspect-[3/4] overflow-hidden bg-muted flex items-center justify-center">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                priority={priority}
              />
            ) : (
              <span className="text-muted-foreground text-sm">No Image</span>
            )}
            {rating && (
              <div className="absolute top-2 right-2">
                <RatingBadge score={rating} divideByTen={ratingDivideByTen} size="sm" />
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3
              className="font-semibold line-clamp-1 group-hover:text-primary transition-colors text-sm"
              title={title}
            >
              {title}
            </h3>
            {subLabel && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{subLabel}</p>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }

  // overlay variant
  return (
    <Link
      href={href}
      className="group relative block transition-transform duration-300 hover:scale-105 hover:-translate-y-2"
    >
      <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-muted shadow-md border border-border/50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        {rating && (
          <div className="absolute top-2 right-2">
            <RatingBadge score={rating} divideByTen={ratingDivideByTen} size="sm" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
        <div className="absolute bottom-0 left-0 w-full p-3">
          <h3 className="text-white font-bold text-sm line-clamp-2 drop-shadow-md">{title}</h3>
          {badges && <div className="flex gap-1 mt-1 flex-wrap">{badges}</div>}
        </div>
      </div>
    </Link>
  );
}
