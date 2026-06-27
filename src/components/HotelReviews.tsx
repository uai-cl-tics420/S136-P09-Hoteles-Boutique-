"use client";
import { useState, useEffect } from "react";
import ReviewForm from "./ReviewForm";
import { loadTranslations } from "@/i18n/i18n-util";

interface Review {
  id: string;
  guestId: string;
  ratingOverall: number;
  ratingService: number;
  ratingCleanliness: number;
  ratingLocation: number;
  comment?: string | null;
  createdAt: string;
}

interface Props {
  hotelId: string;
  initialReviews: Review[];
  initialTotal: number;
  initialHasMore: boolean;
  avgRating: string | null;
  canReview: boolean;
  reviewableBookingId: string | null;
  locale: string;
}

interface GoogleReview {
  author: string;
  rating: number;
  text: string;
  time: string;
  profilePhoto?: string;
}

function GoogleReviewCard({ review }: { review: GoogleReview }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-3 mb-4">
        {review.profilePhoto ? (
          <img src={review.profilePhoto} alt={review.author} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-xs font-black text-white shrink-0">
            G
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--text-primary)]">{review.author}</p>
          <p className="text-xs text-[var(--text-muted)]">{review.time}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-sm ${i < review.rating ? "text-[var(--gold)]" : "text-[var(--border)]"}`}>★</span>
          ))}
        </div>
      </div>
      {review.text && (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-light italic">
          &ldquo;{review.text}&rdquo;
        </p>
      )}
      <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Google Maps</p>
      </div>
    </div>
  );
}

function ReviewCard({ review, t }: { review: Review; t: any }) {
  const initials = review.guestId?.slice(0, 2).toUpperCase() ?? "HV";
  const colors = [
    "from-purple-400 to-indigo-500", "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500", "from-teal-400 to-emerald-500",
  ];
  const colorIdx = review.guestId ? review.guestId.charCodeAt(0) % colors.length : 0;

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-xs)] animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-xs font-black text-white shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--text-primary)]">{t("reviews.verifiedGuest")}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {new Date(review.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-sm ${i < review.ratingOverall ? "text-[var(--gold)]" : "text-[var(--border)]"}`}>★</span>
          ))}
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-light mb-4 italic">
          &ldquo;{review.comment}&rdquo;
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t("reviews.service"),  val: review.ratingService },
          { label: t("reviews.cleanliness"),  val: review.ratingCleanliness },
          { label: t("reviews.location"), val: review.ratingLocation },
        ].map(({ label, val }) => (
          <div key={label} className="bg-[var(--surface-2)] rounded-xl p-2.5 text-center">
            <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-bold">{label}</p>
            <p className="text-sm font-black text-[var(--text-primary)] mt-0.5">
              {val}<span className="text-[10px] font-normal text-[var(--text-muted)]">/5</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HotelReviews({
  hotelId,
  initialReviews,
  initialTotal,
  initialHasMore,
  avgRating,
  canReview,
  reviewableBookingId,
  locale,
}: Props) {
  const [reviews, setReviews]   = useState<Review[]>(initialReviews);
  const [hasMore, setHasMore]   = useState(initialHasMore);
  const [total, setTotal]       = useState(initialTotal);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogle, setShowGoogle] = useState(false);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    loadTranslations(locale as any).then(setT);
  }, [locale]);

  useEffect(() => {
    const fetchGoogleReviews = async () => {
      setGoogleLoading(true);
      try {
        const res = await fetch(`/api/places?hotelId=${hotelId}`);
        const data = await res.json();
        if (data.placesData?.reviews) {
          setGoogleReviews(data.placesData.reviews);
        }
      } catch {
        // Silently fail if Google reviews can't be loaded
      } finally {
        setGoogleLoading(false);
      }
    };
    fetchGoogleReviews();
  }, [hotelId]);

  if (!t) return null;

  async function loadMore() {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?hotelId=${hotelId}&page=${nextPage}&limit=5`);
      const data = await res.json();
      setReviews((prev) => [...prev, ...(data.reviews ?? [])]);
      setHasMore(data.hasMore ?? false);
      setTotal(data.total ?? total);
      setPage(nextPage);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="animate-slide-up">
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          {t("reviews.title")}
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">({total})</span>
          )}
        </h2>
        {avgRating && (
          <div className="text-right">
            <p className="text-3xl font-black text-[var(--text-primary)]">
              <span className="text-[var(--gold)]">★</span> {avgRating}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{t("reviews.averageRating")}</p>
          </div>
        )}
      </div>

      {canReview && reviewableBookingId && (
        <div className="mb-6">
          <ReviewForm hotelId={hotelId} bookingId={reviewableBookingId} locale={locale} />
        </div>
      )}

      {/* Google Reviews Toggle */}
      {googleReviews.length > 0 && (
        <div className="mb-6 flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{t("reviews.title")}</p>
              <p className="text-xs text-[var(--text-muted)]">{googleReviews.length} {t("reviews.externalReviews")}</p>
            </div>
          </div>
          <button
            onClick={() => setShowGoogle(!showGoogle)}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showGoogle ? t("hide") : t("view")}
          </button>
        </div>
      )}

      {showGoogle && googleReviews.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
            {googleReviews.map((r, i) => (
              <GoogleReviewCard key={`google-${i}`} review={r} />
            ))}
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-xs)]">
          <p className="text-3xl mb-3 opacity-30">💬</p>
          <p className="text-[var(--text-muted)] text-sm font-medium">{t("reviews.page.noReviewsYet")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} t={t} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="flex items-center gap-2 bg-white border-2 border-[var(--border)] hover:border-[var(--gold)] text-[var(--text-primary)] hover:text-[var(--gold)] rounded-full px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-300 disabled:opacity-50 hover:shadow-md"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("loading")}
                  </>
                ) : (
                  <>
                    {t("reviews.loadMore")}
                    <span className="text-[10px] bg-[var(--surface)] px-2 py-0.5 rounded-full">
                      {total - reviews.length} {t("reviews.remaining")}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
