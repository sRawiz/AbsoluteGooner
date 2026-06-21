"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export function SearchForm() {
  const router = useRouter();

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q") as string;
    
    if (q && q.trim() !== "") {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full flex-1 md:w-auto md:flex-none">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        name="q"
        type="search"
        placeholder="Search database..."
        className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-muted/50 border-transparent focus-visible:ring-primary/50 transition-all focus:md:w-[300px]"
        autoComplete="off"
      />
    </form>
  );
}
