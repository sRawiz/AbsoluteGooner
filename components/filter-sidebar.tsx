import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface FilterOption {
  id: string;
  name: string;
}

interface FilterSidebarProps {
  title: string;
  options: FilterOption[];
  currentValue?: string;
  baseUrl: string;
}

export function FilterSidebar({ title, options, currentValue, baseUrl }: FilterSidebarProps) {
  return (
    <div className="w-full md:w-64 shrink-0 space-y-4">
      <h2 className="font-semibold text-lg">{title}</h2>
      <div className="flex flex-col gap-1">
        <Link 
          href={baseUrl}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "justify-start font-normal",
            !currentValue && "bg-muted font-medium"
          )}
        >
          All
        </Link>
        {options.map((option) => {
          const isActive = currentValue === option.id;
          return (
            <Link
              key={option.id}
              href={`${baseUrl}?genre=${option.id}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "justify-start font-normal",
                isActive && "bg-muted font-medium text-primary"
              )}
            >
              {option.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
