import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RatingBadgeProps {
  /** Raw score value (e.g. 8.5 for Jikan, or 85 for VNDB which gets divided by 10) */
  score: number;
  /** If true, divides score by 10 (for VNDB ratings stored as 0-100) */
  divideByTen?: boolean;
  size?: "sm" | "md";
}

export function RatingBadge({ score, divideByTen = false, size = "sm" }: RatingBadgeProps) {
  const display = divideByTen ? (score / 10).toFixed(1) : score;

  if (size === "md") {
    return (
      <Badge
        variant="secondary"
        className="flex items-center gap-1 text-base px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border-none"
      >
        <Star className="size-4 fill-primary" />
        {display}
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="font-bold flex items-center gap-1 bg-background/80 backdrop-blur-sm"
    >
      <Star className="size-3 fill-primary text-primary" />
      {display}
    </Badge>
  );
}
