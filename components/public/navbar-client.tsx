"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
}

export default function NavbarClient({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-50 bg-navy">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr]">
          {/* Left: Logo */}
          <Link href="/" className="justify-self-start shrink-0">
            <img
              src="/delauto-logo.png"
              alt="Del Auto D.O.O."
              className="h-10 w-auto object-contain rounded-md"
            />
          </Link>

          {/* Centre: Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {items.map(({ label, href }) => (
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

          {/* Right: mobile toggle */}
          <div className="justify-self-end flex items-center">
            <button
              className="md:hidden text-white/70 hover:text-white"
              onClick={() => setOpen(!open)}
              aria-label="Meni"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden border-t border-white/10 bg-navy px-4 pb-4 pt-3 space-y-1">
            {items.map(({ label, href }) => (
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
          </div>
        )}
      </header>

    </>
  );
}
