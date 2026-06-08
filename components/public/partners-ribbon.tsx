"use client";

import { useRef, useEffect, useLayoutEffect, useCallback } from "react";

interface Partner {
  id: string;
  name: string;
  logo: string | null;
  website: string | null;
}

const SPEED = 0.5; // px per frame

export default function PartnersRibbon({ partners }: { partners: Partner[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const halfWidthRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartPos = useRef(0);

  // Repeat until we have at least 10 items per half — prevents gaps with few partners
  const minCopies = Math.ceil(10 / Math.max(partners.length, 1));
  const half = Array.from({ length: minCopies }, () => partners).flat();
  const items = [...half, ...half]; // doubled for seamless loop

  // Measure BEFORE first paint so RAF never starts with halfWidth = 0
  useLayoutEffect(() => {
    if (trackRef.current) {
      halfWidthRef.current = trackRef.current.scrollWidth / 2;
    }
  }, [partners]);

  const tick = useCallback(() => {
    if (!draggingRef.current && !pausedRef.current) {
      posRef.current += SPEED;
      const hw = halfWidthRef.current;
      if (hw > 0 && posRef.current >= hw) posRef.current -= hw;
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true;
    dragStartX.current = e.clientX;
    dragStartPos.current = posRef.current;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    const hw = halfWidthRef.current;
    let next = dragStartPos.current + (dragStartX.current - e.clientX);
    if (hw > 0) next = ((next % hw) + hw) % hw;
    posRef.current = next;
    if (trackRef.current) trackRef.current.style.transform = `translateX(-${next}px)`;
  };

  const stopDrag = () => { draggingRef.current = false; };

  // Touch drag
  const onTouchStart = (e: React.TouchEvent) => {
    pausedRef.current = true;
    draggingRef.current = true;
    dragStartX.current = e.touches[0].clientX;
    dragStartPos.current = posRef.current;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    const hw = halfWidthRef.current;
    let next = dragStartPos.current + (dragStartX.current - e.touches[0].clientX);
    if (hw > 0) next = ((next % hw) + hw) % hw;
    posRef.current = next;
    if (trackRef.current) trackRef.current.style.transform = `translateX(-${next}px)`;
  };

  if (partners.length === 0) return null;

  return (
    <section className="py-10 border-y border-border" style={{ background: "#0D0D0D" }}>
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-center mb-7"
        style={{ color: "#42C4EC" }}>
        Naši partneri
      </p>
      <div
        className="w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; stopDrag(); }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { draggingRef.current = false; pausedRef.current = false; }}
      >
        <div
          ref={trackRef}
          className="flex items-center w-max"
          style={{ gap: "3.5rem", willChange: "transform" }}
        >
          {items.map((p, i) => {
            const logo = p.logo ? (
              <img
                src={p.logo}
                alt={p.name}
                draggable={false}
                className="h-9 w-auto object-contain transition-all duration-300"
                style={{ maxWidth: 130, opacity: 0.5, filter: "grayscale(1)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "1";
                  (e.currentTarget as HTMLImageElement).style.filter = "grayscale(0)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "0.5";
                  (e.currentTarget as HTMLImageElement).style.filter = "grayscale(1)";
                }}
              />
            ) : (
              <span
                className="text-sm font-bold whitespace-nowrap px-2"
                style={{ color: "rgba(107,114,128,0.6)" }}
              >
                {p.name}
              </span>
            );

            return (
              <div key={`${p.id}-${i}`} className="flex-none" draggable={false}>
                {p.website ? (
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    draggable={false}
                    onClick={(e) => draggingRef.current && e.preventDefault()}
                  >
                    {logo}
                  </a>
                ) : logo}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
