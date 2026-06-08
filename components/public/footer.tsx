import Link from "next/link";

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function OlxIcon() {
  return (
    <span className="text-[11px] font-black tracking-tight leading-none">OLX</span>
  );
}

const VOZILA_LINKS = [
  { label: "Najnovija vozila", href: "/vozila" },
  { label: "Uskoro dostupna", href: "/uskoro" },
  { label: "Rezervisana vozila", href: "/vozila" },
];

const USLUGE_LINKS = [
  { label: "Test vožnja", href: "/kontakt" },
  { label: "Naše operacije", href: "/operacije" },
  { label: "Vijesti i blog", href: "/vijesti" },
];

const KOMPANIJA_LINKS = [
  { label: "O nama", href: "/o-nama" },
  { label: "Kontakt", href: "/kontakt" },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <img
                src="/delauto-logo.png"
                alt="Del Auto D.O.O."
                className="h-12 w-auto object-contain rounded-md"
              />
            </Link>
            <p className="text-sm text-white/55 mb-5 leading-relaxed">
              Pouzdan uvoz vozila iz Francuske. Garantovano provjereni kilometri — vaš pouzdani
              partner za kupovinu automobila u Sarajevu.
            </p>
            <div className="flex gap-2.5">
              <a
                href="https://www.instagram.com/delauto_sarajevo/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://olx.ba/shops/DelAuto/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                aria-label="OLX"
              >
                <OlxIcon />
              </a>
            </div>
          </div>

          {/* Vozila */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-white">Vozila</h4>
            <div className="space-y-2.5">
              {VOZILA_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-sm text-white/55 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Usluge */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-white">Usluge</h4>
            <div className="space-y-2.5">
              {USLUGE_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-sm text-white/55 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Kompanija */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-white">Kompanija</h4>
            <div className="space-y-2.5">
              {KOMPANIJA_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-sm text-white/55 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-wrap gap-4 items-center justify-between text-xs text-white/35">
          <p>© {new Date().getFullYear()} Del Auto D.O.O. Sva prava zadržana.</p>
          <Link href="/admin" className="hover:text-white/60 transition-colors">
            Admin panel
          </Link>
        </div>
      </div>
    </footer>
  );
}
