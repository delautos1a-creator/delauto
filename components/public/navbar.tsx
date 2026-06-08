"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import BookingModal from "./booking-modal";

const NAV = [
  { label: "Vozila", href: "/vozila" },
  { label: "Uskoro", href: "/uskoro" },
  { label: "Operacije", href: "/operacije" },
  { label: "Vijesti", href: "/vijesti" },
  { label: "O nama", href: "/o-nama" },
  { label: "Kontakt", href: "/kontakt" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-50 bg-navy">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <img
              src="/delauto-logo.png"
              alt="Del Auto D.O.O."
              className="h-10 w-auto object-contain rounded-md"
            />
          </Link>

          {/* Desktop nav — centred */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {NAV.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(href)
                    ? "text-white bg-white/10"
                    : "text-white/65 hover:text-white hover:bg-white/10"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA button */}
          <button
            onClick={() => setBookingOpen(true)}
            className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold shrink-0 transition-opacity hover:opacity-90 bg-primary text-primary-foreground"
          >
            Zakaži test vožnju
          </button>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white/70 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Meni"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden border-t border-white/10 bg-navy px-4 pb-4 pt-3 space-y-1">
            {NAV.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(href)
                    ? "text-white bg-white/10"
                    : "text-white/65 hover:text-white hover:bg-white/10"
                )}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => { setOpen(false); setBookingOpen(true); }}
              className="w-full mt-2 px-4 py-2.5 rounded-full text-sm font-bold bg-primary text-primary-foreground"
            >
              Zakaži test vožnju
            </button>
          </div>
        )}
      </header>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  );
}
