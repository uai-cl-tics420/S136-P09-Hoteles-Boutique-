import { getHotels } from "@/services/hotel.service";
import { auth } from "@/lib/auth/nextauth.config";
import type { HotelCategory } from "@/types/domain";
import HotelsPageContent from "./HotelsPageContent";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    query?: string; category?: string;
    maxPrice?: string; minStars?: string; page?: string; experience?: string;
    country?: string;
  }>;
}

export default async function HotelsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  // Fetch session first — needed to know if we should load preferences
  const session = await auth();
  const userId = (session?.user as any)?.id ?? null;

  // Load preferences directly from DB (avoid internal HTTP round-trip)
  let preferredCategories: string[] = [];
  if (userId) {
    try {
      const { db } = await import("@/db");
      const { guestPreferences } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");
      const pref = await db.query.guestPreferences.findFirst({
        where: eq(guestPreferences.guestId, userId),
        columns: { preferredCategories: true },
      });
      preferredCategories = (pref?.preferredCategories as string[]) ?? [];
    } catch { /* silently ignore — preferences are best-effort */ }
  }

  const hotels = await getHotels({
    query:               sp.query,
    category:            sp.category as HotelCategory | undefined,
    maxPrice:            sp.maxPrice ? parseFloat(sp.maxPrice) : undefined,
    minStars:            sp.minStars ? parseInt(sp.minStars)   : undefined,
    page:                sp.page     ? parseInt(sp.page)       : 1,
    limit:               150,
    preferredCategories: preferredCategories.length > 0 ? preferredCategories : undefined,
    experienceType:      sp.experience,
    country:             sp.country,
  });

  const isFiltered       = !!(sp.query || sp.category || sp.maxPrice || sp.minStars || sp.experience || sp.country);
  const isPersonalised   = !isFiltered && preferredCategories.length > 0;

  return (
    <HotelsPageContent
      locale={locale}
      hotels={hotels}
      session={session}
      isFiltered={isFiltered}
      isPersonalised={isPersonalised}
    />
  );
}
