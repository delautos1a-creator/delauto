"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Car, Menu, X } from "lucide-react";

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

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-lg">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Car className="w-4 h-4 text-primary-foreground" />
          </div>
          Del Auto
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
