import { db } from "./index";
import { hotels, reviews, bookings, users, roomTypes } from "./schema";
import { eq, sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env" });

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error("No Google Maps API Key found in .env");
  process.exit(1);
}

async function findPlaceId(name: string, location: string) {
  const query = `${name} ${location}`;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.candidates && data.candidates.length > 0) {
    return data.candidates[0].place_id;
  }
  return null;
}

async function getPlaceReviews(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&reviews_sort=newest&language=es&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.result && data.result.reviews) {
    return data.result.reviews;
  }
  return [];
}

async function seedReviews() {
  console.log("Seeding real reviews from Google Places...");

  // Get or create a Google Reviewer user
  let reviewerId: string;
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, 'reviewer@google.com')
  });
  if (existingUser) {
    reviewerId = existingUser.id;
  } else {
    const insertedUser = await db.insert(users).values({
      email: 'reviewer@google.com',
      role: 'GUEST'
    }).returning({ id: users.id });
    reviewerId = insertedUser[0].id;
  }

  // Fetch all hotels
  const allHotels = await db.query.hotels.findMany({
    with: {
      roomTypes: { limit: 1 }
    }
  });

  console.log(`Found ${allHotels.length} hotels in database.`);
  let totalReviewsInserted = 0;

  for (const hotel of allHotels) {
    if (!hotel.roomTypes || hotel.roomTypes.length === 0) continue;

    console.log(`Processing hotel: ${hotel.name}`);
    const placeId = await findPlaceId(hotel.name, hotel.locationCity);
    
    if (!placeId) {
      console.log(`❌ Could not find Place ID for ${hotel.name}`);
      continue;
    }

    const googleReviews = await getPlaceReviews(placeId);
    if (!googleReviews || googleReviews.length === 0) {
      console.log(`⚠️ No reviews found for ${hotel.name}`);
      continue;
    }

    console.log(`Found ${googleReviews.length} reviews for ${hotel.name}`);

    for (const review of googleReviews) {
      // 1. Create a completed dummy booking for this review
      const dummyBooking = await db.insert(bookings).values({
        guestId: reviewerId,
        roomTypeId: hotel.roomTypes[0].id,
        checkIn: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        checkOut: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 28 days ago
        guestsCount: 2,
        totalPrice: hotel.roomTypes[0].pricePerNight,
        status: "COMPLETED",
        specialRequests: `Review import from Google Maps - ${review.author_name || "Google User"}`
      }).returning({ id: bookings.id });

      // 2. Insert the review
      // Google places gives a single rating (1-5). We distribute it with some variation for the specific categories.
      const rating = review.rating || 5;
      const getVariation = (base: number) => Math.min(5, Math.max(1, base + (Math.floor(Math.random() * 3) - 1)));

      await db.insert(reviews).values({
        bookingId: dummyBooking[0].id,
        guestId: reviewerId,
        hotelId: hotel.id,
        ratingOverall: rating,
        ratingService: getVariation(rating),
        ratingCleanliness: getVariation(rating),
        ratingLocation: getVariation(rating),
        comment: `${review.text || ""}\n\n— ${review.author_name || "Google User"} (Google Maps)`
      });

      totalReviewsInserted++;
    }
  }

  console.log(`✅ Success! Inserted ${totalReviewsInserted} real reviews from Google Places.`);
  process.exit(0);
}

seedReviews().catch(console.error);
