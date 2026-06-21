"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AnimeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Anime catalog error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div className="flex items-center justify-center size-16 rounded-full bg-destructive/10">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Failed to load anime</h2>
        <p className="text-muted-foreground max-w-md">
          Something went wrong while fetching the anime catalog. This is usually a temporary issue.
        </p>
      </div>
      <Button onClick={reset} variant="default">
        Try again
      </Button>
    </div>
  );
}
