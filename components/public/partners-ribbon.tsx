"use client";

import { useRef, useEffect, useCallback } from "react";

interface Partner {
  id: string;
  name: string;
  logo: string | null;
  website: string | null;
}

export default function PartnersRibbon({ partners }: { partners: Partner[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const halfWidthRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartPos = useRef(0);

  const SPEED = 0.6; // px per frame
  const doubled = [...partners, ...partners];

  const tick = useCallback(() => {
    if (!draggingRef.current && !pausedRef.current) {
      posRef.current += SPEED;
      const half = halfWidthRef.current;
      if (half > 0 && posRef.current >= half) posRef.current -= half;
      if (trackRef.current) trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    // Measure after first paint
    const frame = requestAnimationFrame(() => {
      if (trackRef.current) halfWidthRef.current = trackRef.current.scrollWidth / 2;
    });
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(rafRef.current);
    };
  }, [partners, tick]);

  // Mouse drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true;
    dragStartX.current = e.clientX;
    dragStartPos.current = posRef.current;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    const half = halfWidthRef.current;
    let next = dragStartPos.current + (dragStartX.current - e.clientX);
    if (half > 0) next = ((next % half) + half) % half;
    posRef.current = next;
    if (trackRef.current) trackRef.current.style.transform = `translateX(-${next}px)`;
  };

  const stopDrag = () => { draggingRef.current = false; };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    pausedRef.current = true;
    draggingRef.current = true;
    dragStartX.current = e.touches[0].clientX;
    dragStartPos.current = posRef.current;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    const half = halfWidthRef.current;
    let next = dragStartPos.current + (dragStartX.current - e.touches[0].clientX);
    if (half > 0) next = ((next % half) + half) % half;
    posRef.current = next;
    if (trackRef.current) trackRef.current.style.transform = `translateX(-${next}px)`;
  };

  const onTouchEnd = () => {
    draggingRef.current = false;
    pausedRef.current = false;
  };

  if (partners.length === 0) return null;

  return (
    <section className="py-10 border-y border-border bg-card">
      <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase text-center mb-8">
        Naši partneri
      </p>
      <div
        className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; stopDrag(); }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={trackRef}
          className="flex items-center gap-14 w-max"
          style={{ willChange: "transform" }}
        >
          {doubled.map((p, i) => (
            <div key={`${p.id}-${i}`} className="flex-none" draggable={false}>
              {p.website ? (
                <a
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  draggable={false}
                  onClick={(e) => draggingRef.current && e.preventDefault()}
                >
                  <LogoItem partner={p} />
                </a>
              ) : (
                <LogoItem partner={p} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoItem({ partner }: { partner: Partner }) {
  if (partner.logo) {
    return (
      <img
        src={partner.logo}
        alt={partner.name}
        draggable={false}
        className="h-9 w-auto max-w-[130px] object-contain opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-300"
      />
    );
  }
  return (
    <span className="text-sm font-bold text-muted-foreground/50 hover:text-muted-foreground whitespace-nowrap transition-colors px-2">
      {partner.name}
    </span>
  );
}
