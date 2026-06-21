"use client";

import { useOptimistic, useTransition } from "react";
import { addOrUpdateLibraryItem, removeLibraryItem, LibraryStatus, ItemType } from "@/app/actions/library";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Bookmark, Check, Loader2, Trash } from "lucide-react";
import { toast } from "sonner";

interface Props {
  itemId: string;
  itemType: ItemType;
  initialStatus: LibraryStatus | null;
  isLoggedIn: boolean;
}

const statusMap: Record<LibraryStatus, string> = {
  planning: "Plan to Watch/Play",
  playing: "Currently Watching/Playing",
  completed: "Completed",
  dropped: "Dropped",
};

export function LibraryButton({ itemId, itemType, initialStatus, isLoggedIn }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(initialStatus);

  const handleUpdate = (status: LibraryStatus) => {
    if (!isLoggedIn) {
      toast.error("Please sign in to manage your library.");
      return;
    }
    startTransition(async () => {
      setOptimisticStatus(status);
      const res = await addOrUpdateLibraryItem(itemId, itemType, status);
      if (!res?.success) {
        toast.error(res?.error || "Failed to update library.");
      } else {
        toast.success(`Added to "${statusMap[status]}"`);
      }
    });
  };

  const handleRemove = () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to manage your library.");
      return;
    }
    startTransition(async () => {
      setOptimisticStatus(null);
      const res = await removeLibraryItem(itemId, itemType);
      if (!res?.success) {
        toast.error(res?.error || "Failed to remove from library.");
      } else {
        toast.success("Removed from library.");
      }
    });
  };

  if (!optimisticStatus) {
    return (
      <Button
        onClick={() => handleUpdate("planning")}
        disabled={isPending}
        className="gap-2"
        size="lg"
      >
        {isPending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Bookmark className="size-5" />
        )}
        Add to Library
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          disabled={isPending}
          className="gap-2 border-green-500/50 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400"
          size="lg"
        >
          {isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Check className="size-5" />
          )}
          {statusMap[optimisticStatus]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {(Object.entries(statusMap) as [LibraryStatus, string][]).map(([status, label]) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleUpdate(status)}
            className="cursor-pointer"
          >
            {label}
            {status === optimisticStatus && (
              <Check className="size-4 ml-auto text-green-500" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleRemove}
          className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
        >
          <Trash className="size-4 mr-2" />
          Remove from Library
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
