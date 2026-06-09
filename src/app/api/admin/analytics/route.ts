import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth.config";
import { db } from "@/db";
import { bookings, hotels, reviews, roomTypes } from "@/db/schema";
import { eq, sql, gte, and, inArray } from "drizzle-orm";

const ADMIN_ROLES = ["HOTEL_ADMIN", "SUPER_ADMIN"];

export async function GET() {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminId = (session.user as any).id as string;
    const isSuperAdmin = role === "SUPER_ADMIN";

    // Get hotels for this admin (or all if super admin)
    const adminHotels = isSuperAdmin
      ? await db.select({ id: hotels.id, name: hotels.name, category: hotels.category }).from(hotels)
      : await db
          .select({ id: hotels.id, name: hotels.name, category: hotels.category })
          .from(hotels)
          .where(eq(hotels.ownerId, adminId));

    if (adminHotels.length === 0) {
      return NextResponse.json({ analytics: emptyAnalytics() });
    }

    const hotelIds = adminHotels.map((h) => h.id);

    // Get all room type ids for these hotels
    const hotelRoomTypes = await db
      .select({ id: roomTypes.id, hotelId: roomTypes.hotelId })
      .from(roomTypes)
      .where(inArray(roomTypes.hotelId, hotelIds));

    const roomTypeIds = hotelRoomTypes.map((r) => r.id);

    if (roomTypeIds.length === 0) {
      return NextResponse.json({ analytics: emptyAnalytics() });
    }

    // Bookings in last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0];

    const [allBookings, ratingRows, recentBookings] = await Promise.all([
      // All bookings for these hotels
      db.query.bookings.findMany({
        where: inArray(bookings.roomTypeId, roomTypeIds),
        with: { roomType: { columns: { hotelId: true } } },
      }),

      // Ratings per hotel
      db
        .select({
          hotelId: reviews.hotelId,
          avgOverall: sql<string>`ROUND(AVG(${reviews.ratingOverall})::numeric, 1)`,
          reviewCount: sql<number>`COUNT(${reviews.id})`,
        })
        .from(reviews)
        .where(inArray(reviews.hotelId, hotelIds))
        .groupBy(reviews.hotelId),

      // Bookings by month (last 6 months)
      db
        .select({
          month: sql<string>`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`,
          count: sql<number>`COUNT(*)`,
          revenue: sql<string>`SUM(CAST(${bookings.totalPrice} AS NUMERIC))`,
        })
        .from(bookings)
        .where(
          and(
            inArray(bookings.roomTypeId, roomTypeIds),
            gte(bookings.createdAt, new Date(sixMonthsAgoStr))
          )
        )
        .groupBy(sql`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`),
    ]);

    // Build hotel room type map
    const roomTypeHotelMap = new Map(hotelRoomTypes.map((r) => [r.id, r.hotelId]));
    const ratingMap = new Map(ratingRows.map((r) => [r.hotelId, r]));

    // Aggregate per hotel
    const hotelStats = adminHotels.map((h) => {
      const hotelBookings = allBookings.filter(
        (b) => roomTypeHotelMap.get(b.roomTypeId) === h.id
      );
      const confirmed = hotelBookings.filter((b) => b.status === "CONFIRMED").length;
      const completed = hotelBookings.filter((b) => b.status === "COMPLETED").length;
      const pending = hotelBookings.filter((b) => b.status === "PENDING").length;
      const cancelled = hotelBookings.filter((b) => b.status === "CANCELLED").length;
      const revenue = hotelBookings
        .filter((b) => ["CONFIRMED", "COMPLETED"].includes(b.status))
        .reduce((a, b) => a + parseFloat(b.totalPrice ?? "0"), 0);

      const rating = ratingMap.get(h.id);

      return {
        id: h.id,
        name: h.name,
        category: h.category,
        totalBookings: hotelBookings.length,
        confirmed,
        completed,
        pending,
        cancelled,
        revenue,
        avgRating: rating?.avgOverall ? parseFloat(rating.avgOverall) : null,
        reviewCount: rating?.reviewCount ?? 0,
      };
    });

    // Summary KPIs
    const totalRevenue = hotelStats.reduce((a, h) => a + h.revenue, 0);
    const totalBookings = allBookings.length;
    const totalPending = hotelStats.reduce((a, h) => a + h.pending, 0);
    const totalConfirmed = hotelStats.reduce((a, h) => a + h.confirmed, 0);

    // Monthly chart data — fill gaps
    const monthlyMap = new Map(recentBookings.map((r) => [r.month, r]));
    const months: { month: string; label: string; count: number; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("es", { month: "short", year: "2-digit" });
      const row = monthlyMap.get(key);
      months.push({
        month: key,
        label,
        count: row ? Number(row.count) : 0,
        revenue: row ? parseFloat(row.revenue ?? "0") : 0,
      });
    }

    // Status distribution for pie chart
    const statusDist = [
      { name: "Confirmadas", value: totalConfirmed, color: "#10b981" },
      { name: "Completadas", value: hotelStats.reduce((a, h) => a + h.completed, 0), color: "#6b7280" },
      { name: "Pendientes", value: totalPending, color: "#f59e0b" },
      { name: "Canceladas", value: hotelStats.reduce((a, h) => a + h.cancelled, 0), color: "#ef4444" },
    ].filter((s) => s.value > 0);

    return NextResponse.json({
      analytics: {
        kpis: {
          totalRevenue,
          totalBookings,
          totalPending,
          totalConfirmed,
          totalHotels: adminHotels.length,
          avgRating:
            hotelStats.filter((h) => h.avgRating).reduce((a, h) => a + (h.avgRating ?? 0), 0) /
              (hotelStats.filter((h) => h.avgRating).length || 1),
        },
        hotelStats,
        monthlyChart: months,
        statusDist,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/analytics]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function emptyAnalytics() {
  return {
    kpis: { totalRevenue: 0, totalBookings: 0, totalPending: 0, totalConfirmed: 0, totalHotels: 0, avgRating: 0 },
    hotelStats: [],
    monthlyChart: [],
    statusDist: [],
  };
}
