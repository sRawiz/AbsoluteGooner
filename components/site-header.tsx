import Link from "next/link"
import { Bookmark } from "lucide-react"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/server"
import { UserNav } from "@/components/user-nav"
import { SearchForm } from "@/components/search-form"
import type { AuthClaims } from "@/components/user-nav"

/**
 * Single async component that reads auth state once.
 * Uses getClaims() (reads JWT from cookie locally, no network call)
 * instead of getUser() (validates JWT with Supabase server, ~400ms network).
 * For a nav header, local JWT claims are sufficient.
 */
async function DynamicHeader() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  return (
    <>
      <HeaderNav user={user} />
      <div className="flex flex-1 items-center justify-end space-x-4">
        <SearchForm />
        <HeaderAuth user={user} />
      </div>
    </>
  )
}

function HeaderNav({ user }: { user: AuthClaims | null }) {
  return (
    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
      <Link href="/anime" className="transition-colors hover:text-primary text-foreground/70">
        Anime
      </Link>
      <Link href="/vn" className="transition-colors hover:text-primary text-foreground/70">
        Visual Novels
      </Link>
      {user && (
        <Link
          href="/library"
          className="transition-colors hover:text-primary text-foreground/70 flex items-center gap-1"
        >
          <Bookmark className="size-4" />
          My Library
        </Link>
      )}
    </nav>
  )
}

function HeaderAuth({ user }: { user: AuthClaims | null }) {
  if (user) {
    return <UserNav user={user} />
  }
  return (
    <Button asChild variant="default" size="sm" className="font-semibold">
      <Link href="/auth/login">Sign In</Link>
    </Button>
  )
}

/** Skeleton for the entire dynamic section while auth resolves */
function DynamicHeaderSkeleton() {
  return (
    <>
      {/* Nav placeholder */}
      <div className="hidden md:flex items-center space-x-6">
        <div className="h-4 w-12 rounded bg-muted animate-pulse" />
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      </div>
      {/* Search + auth placeholder */}
      <div className="flex flex-1 items-center justify-end space-x-4">
        <SearchForm />
        <div className="size-8 rounded-full bg-muted animate-pulse" />
      </div>
    </>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4 sm:px-8">
        {/* Logo — static, always instant */}
        <Link href="/" className="mr-6 flex items-center space-x-2 shrink-0">
          <span className="text-xl font-bold tracking-tight">
            ABS<span className="text-primary">GOONER</span>
          </span>
        </Link>

        {/* Single Suspense for ALL auth-dependent content */}
        <div className="flex flex-1 items-center space-x-4 md:justify-between">
          <Suspense fallback={<DynamicHeaderSkeleton />}>
            <DynamicHeader />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
