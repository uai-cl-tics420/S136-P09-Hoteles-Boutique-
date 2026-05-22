"use client";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  hotelId: string;
  bookingId: string;
  locale: string;
  onSuccess?: () => void;
}

function StarRating({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
      <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(star)}
            className={`text-xl transition-all duration-100 ${
              star <= (hovered || value) ? "text-[var(--gold)] scale-110" : "text-[var(--border)] hover:scale-105"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewForm({ hotelId, bookingId, locale, onSuccess }: Props) {
  const [ratingOverall, setRatingOverall]         = useState(0);
  const [ratingService, setRatingService]         = useState(0);
  const [ratingCleanliness, setRatingCleanliness] = useState(0);
  const [ratingLocation, setRatingLocation]       = useState(0);
  const [comment, setComment]                     = useState("");
  const [submitting, setSubmitting]               = useState(false);
  const [submitted, setSubmitted]                 = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ratingOverall || !ratingService || !ratingCleanliness || !ratingLocation) {
      toast.error("Por favor califica todas las categorías");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          hotelId,
          ratingOverall,
          ratingService,
          ratingCleanliness,
          ratingLocation,
          comment: comment.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("¡Reseña publicada! Gracias por compartir tu experiencia.");
        setSubmitted(true);
        onSuccess?.();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "No se pudo publicar la reseña");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center animate-slide-up">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-lg font-black text-[var(--text-primary)] mb-1">¡Gracias por tu reseña!</p>
        <p className="text-sm font-medium text-[var(--text-muted)]">Tu opinión ayuda a otros viajeros a elegir mejor.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[var(--border)] p-7 shadow-[var(--shadow-xs)] animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[var(--gold)] rounded-2xl flex items-center justify-center text-white text-lg">★</div>
        <div>
          <h3 className="text-base font-black text-[var(--text-primary)]">Califica tu estadía</h3>
          <p className="text-xs font-medium text-[var(--text-muted)]">Como huésped verificado, comparte tu experiencia</p>
        </div>
      </div>

      <div className="space-y-4 mb-5">
        <div className="bg-[var(--surface)] rounded-2xl p-4 space-y-3 border border-[var(--border)]">
          <StarRating label="General" value={ratingOverall} onChange={setRatingOverall} />
          <StarRating label="Servicio" value={ratingService} onChange={setRatingService} />
          <StarRating label="Limpieza" value={ratingCleanliness} onChange={setRatingCleanliness} />
          <StarRating label="Ubicación" value={ratingLocation} onChange={setRatingLocation} />
        </div>

        {ratingOverall > 0 && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-center text-[var(--text-muted)]">
            {["", "Muy malo 😞", "Malo 😕", "Regular 😐", "Bueno 😊", "¡Excelente! 🤩"][ratingOverall]}
          </p>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
            Comentario <span className="normal-case font-normal">(Opcional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Cuéntanos sobre tu experiencia: el trato del personal, las instalaciones, lo que más te gustó..."
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || !ratingOverall}
        className="w-full bg-[var(--gold)] text-white rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest hover:bg-yellow-600 transition-all disabled:opacity-50 shadow-md"
      >
        {submitting ? "Publicando reseña..." : "Publicar Reseña ★"}
      </button>
    </form>
  );
}
