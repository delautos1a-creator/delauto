import Link from "next/link";
import { Car } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-black text-lg mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Car className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              Del Auto
            </Link>
            <p className="text-sm text-muted-foreground">
              Specijalizovani uvoznik i prodavač premium vozila. Sarajevo, BiH.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3">Navigacija</h4>
            <div className="space-y-2">
              {[
                { label: "Vozila", href: "/vozila" },
                { label: "Uskoro", href: "/uskoro" },
                { label: "Operacije", href: "/operacije" },
                { label: "Vijesti", href: "/vijesti" },
              ].map(({ label, href }) => (
                <Link key={href} href={href} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3">Kontakt</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Sarajevo, BiH</p>
              <p>info@delauto.ba</p>
              <p>+387 61 000 000</p>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-wrap gap-4 items-center justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Del Auto. Sva prava zadržana.</p>
          <Link href="/admin" className="hover:text-foreground transition-colors">Admin panel</Link>
        </div>
      </div>
    </footer>
  );
}
