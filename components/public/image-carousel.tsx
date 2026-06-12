"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Car } from "lucide-react";

interface Props {
  images: string[];
  alt?: string;
  badge?: React.ReactNode;
}

export default function ImageCarousel({ images, alt = "", badge }: Props) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  }, [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 48) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  if (!images.length) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border bg-secondary aspect-video flex items-center justify-center">
        <Car className="w-16 h-16 text-muted-foreground/20" />
      </div>
    );
  }

  const single = images.length === 1;

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="relative rounded-2xl overflow-hidden border border-border group cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="aspect-video overflow-hidden">
          <img
            src={images[current]}
            alt={alt}
            className="w-full h-full object-cover select-none"
            draggable={false}
          />
        </div>

        {/* Badge slot */}
        {badge}

        {/* Image counter */}
        {!single && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full pointer-events-none">
            {current + 1} / {images.length}
          </div>
        )}

        {/* Left arrow */}
        {!single && (
          <button
            onClick={prev}
            aria-label="Prethodna slika"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all
              opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right arrow */}
        {!single && (
          <button
            onClick={next}
            aria-label="Sljedeća slika"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all
              opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                current === i
                  ? "border-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
