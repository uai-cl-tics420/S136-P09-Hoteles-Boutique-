export type UserRole = "GUEST" | "HOTEL_ADMIN" | "SUPER_ADMIN";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type HotelCategory = "LUXURY" | "BOUTIQUE" | "ECO" | "BEACH" | "MOUNTAIN" | "CITY";
export type ExtraCategory = "SPA" | "DINING" | "TRANSPORT" | "EXPERIENCE" | "OTHER";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  locale: string;
  otpEnabled: string;
  createdAt: Date;
}

export interface Hotel {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  locationCity: string;
  locationCountry: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  category: HotelCategory;
  starRating: number;
  active: boolean;
  createdAt: Date;
  images?: HotelImage[];
  roomTypes?: RoomType[];
}

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  capacity: number;
  pricePerNight: string;
  currency: string;
  totalRooms: number;
  amenities: string[];
}

export interface Booking {
  id: string;
  guestId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  totalPrice: string;
  currency: string;
  status: BookingStatus;
  specialRequests: string | null;
  createdAt: Date;
}

export interface Review {
  id: string;
  bookingId: string;
  guestId: string;
  hotelId: string;
  ratingOverall: number;
  ratingService: number;
  ratingCleanliness: number;
  ratingLocation: number;
  comment: string | null;
  createdAt: Date;
}

export interface HotelImage {
  id: string;
  hotelId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isCover: boolean;
}

export interface ExtraService {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  category: ExtraCategory;
  available: boolean;
}