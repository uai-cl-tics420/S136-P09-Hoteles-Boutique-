import { getHotels } from "@/services/hotel.service";
import { auth } from "@/lib/auth/nextauth.config";
import type { HotelCategory } from "@/types/domain";
import HotelsPageContent from "./HotelsPageContent";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

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
  const page = sp.page ? parseInt(sp.page) : 1;

  const session = await auth();
  const userId = (session?.user as any)?.id ?? null;

  let preferredCategories: string[] = [];
  if (userId) {
    try {
      const { guestPreferences } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");
      const pref = await db.query.guestPreferences.findFirst({
        where: eq(guestPreferences.guestId, userId),
        columns: { preferredCategories: true },
      });
      preferredCategories = (pref?.preferredCategories as string[]) ?? [];
    } catch { /* best-effort */ }
  }

  // Total count for pagination display
  const [totalRow] = await db.execute(sql`SELECT COUNT(*) as c FROM hotels WHERE active = true`);
  const totalHotels = Number(totalRow.c);

  const hotels = await getHotels({
    query:               sp.query,
    category:            sp.category as HotelCategory | undefined,
    maxPrice:            sp.maxPrice ? parseFloat(sp.maxPrice) : undefined,
    minStars:            sp.minStars ? parseInt(sp.minStars)   : undefined,
    page,
    limit:               PAGE_SIZE,
    preferredCategories: preferredCategories.length > 0 ? preferredCategories : undefined,
    experienceType:      sp.experience,
    country:             sp.country,
  });

  const isFiltered     = !!(sp.query || sp.category || sp.maxPrice || sp.minStars || sp.experience || sp.country);
  const isPersonalised = !isFiltered && preferredCategories.length > 0;
  const totalPages     = Math.ceil(totalHotels / PAGE_SIZE);

  return (
    <HotelsPageContent
      locale={locale}
      hotels={hotels}
      session={session}
      isFiltered={isFiltered}
      isPersonalised={isPersonalised}
      currentPage={page}
      totalPages={totalPages}
      totalHotels={totalHotels}
    />
  );
}
