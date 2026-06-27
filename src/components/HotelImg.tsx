"use client";

const FALLBACKS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80&auto=format&fit=crop",
];

function getFallback(seed: string) {
  return FALLBACKS[seed.charCodeAt(0) % FALLBACKS.length];
}

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSeed?: string;
}

/**
 * A drop-in <img> replacement that gracefully handles broken URLs.
 * Falls back to a curated Unsplash hotel photo on error.
 */
export default function HotelImg({ src, alt, fallbackSeed = src, ...rest }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      {...rest}
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.dataset.fb) {
          img.dataset.fb = "1";
          img.src = getFallback(fallbackSeed);
        }
      }}
    />
  );
}
