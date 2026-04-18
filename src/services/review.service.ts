import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq, avg, desc } from "drizzle-orm";

export async function createReview(data: {
  bookingId: string;
  guestId: string;
  hotelId: string;
  ratingOverall: number;
  ratingService: number;
  ratingCleanliness: number;
  ratingLocation: number;
  comment?: string;
}) {
  const [review] = await db.insert(reviews).values(data).returning();
  return review;
}

export async function getReviewsByHotel(hotelId: string) {
  return db.query.reviews.findMany({
    where: eq(reviews.hotelId, hotelId),
    orderBy: [desc(reviews.createdAt)],
    limit: 50,
  });
}