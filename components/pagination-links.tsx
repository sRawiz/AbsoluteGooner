import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationLinks({ 
  currentPage, 
  hasNextPage, 
  baseUrl,
  searchParams 
}: { 
  currentPage: number; 
  hasNextPage: boolean; 
  baseUrl: string;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const query = new URLSearchParams();
  
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== "page" && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => query.append(key, v));
        } else {
          query.append(key, value);
        }
      }
    });
  }
  
  const queryString = query.toString();
  const prefix = queryString ? `?${queryString}&` : `?`;

  return (
    <div className="flex items-center justify-center gap-4 my-8">
      <Button variant="outline" disabled={currentPage <= 1} asChild={currentPage > 1}>
        {currentPage > 1 ? (
          <Link href={`${baseUrl}${prefix}page=${currentPage - 1}`}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Link>
        ) : (
          <div className="flex items-center cursor-not-allowed opacity-50">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </div>
        )}
      </Button>

      <span className="text-sm font-medium">Page {currentPage}</span>

      <Button variant="outline" disabled={!hasNextPage} asChild={hasNextPage}>
        {hasNextPage ? (
          <Link href={`${baseUrl}${prefix}page=${currentPage + 1}`}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Link>
        ) : (
          <div className="flex items-center cursor-not-allowed opacity-50">
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </div>
        )}
      </Button>
    </div>
  );
}
