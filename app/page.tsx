import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import VehicleTabs from "@/components/public/vehicle-tabs";
import type { Vehicle, Testimonial, NewsArticle } from "@/types/database";
import { Star, ArrowRight, MapPin, Phone, Mail, Clock } from "lucide-react";

const TRUST_CARDS = [
  {
    icon: "🔍",
    title: "Provjerena vozila",
    desc: "Svako vozilo prolazi kompletan tehnički pregled i provjeru s punim servisnim historijatom.",
  },
  {
    icon: "💰",
    title: "Transparentne cijene",
    desc: "Nema skrivenih troškova. Cijena koju vidite je cijena koju plaćate — uvijek.",
  },
  {
    icon: "🚗",
    title: "Probna vožnja",
    desc: "Rezervišite besplatnu probnu vožnju bilo kojeg vozila u naše radno vrijeme.",
  },
  {
    icon: "🏦",
    title: "Kreditiranje",
    desc: "Povoljne finansijske opcije putem partnerskih banaka i leasingnih kuća.",
  },
  {
    icon: "🛡️",
    title: "Garancija dostupna",
    desc: "Garancija do 12 mjeseci na odabrana vozila s certifikovanim servisnim ugovorom.",
  },
  {
    icon: "🇫🇷",
    title: "Uvoz iz Francuske",
    desc: "Direktan uvoz iz Francuske — transparentan proces i dokumentacija na svakom koraku.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: vehicles },
    { data: testimonials },
    { data: news },
  ] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*")
      .in("status", ["available", "reserved"])
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("testimonials")
      .select("*")
      .eq("is_approved", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("news")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  return (
    <>
      <Navbar />
      <main>

        {/* ── HERO ── */}
        <section
          className="relative min-h-[90vh] flex items-center"
          style={{
            backgroundImage: "url('/hero-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 w-full py-24">
            <p className="text-xs font-semibold tracking-[0.2em] text-white/50 uppercase mb-5">
              Uvoz vozila iz Francuske • Sarajevo
            </p>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-6 max-w-2xl">
              Pronađite Vaš<br />
              Sljedeći Auto<br />
              <span className="text-primary">S Povjerenjem</span>
            </h1>

            <p className="text-white/65 max-w-lg mb-10 text-base leading-relaxed">
              Uvozimo kvalitetna vozila iz Francuske s garantovanim provjerenim kilometrima.
              Transparentne cijene i pouzdana usluga — sve na jednom mjestu.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-10 mb-12">
              {[
                { value: "200+", label: "Vozila prodana" },
                { value: "100%", label: "Provjerena vozila" },
                { value: "FR", label: "Direktan uvoz" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-black text-white">{value}</p>
                  <p className="text-sm text-white/45 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Glassmorphism search/CTA bar */}
            <div
              className="inline-flex flex-wrap gap-3 items-center p-2.5 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.13)",
              }}
            >
              <Link
                href="/vozila"
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 bg-primary text-primary-foreground"
              >
                Pretraži dostupna vozila
              </Link>
              <Link
                href="/kontakt"
                className="px-5 py-3 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-colors"
              >
                Kontaktirajte nas
              </Link>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30">
            <span className="text-xs tracking-widest uppercase">Skroluj</span>
            <div className="w-px h-8 bg-white/20" />
          </div>
        </section>

        {/* ── ISTAKNUTA VOZILA ── */}
        <section className="py-20 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
                  Naša ponuda
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-foreground">
                  Istaknuta vozila
                </h2>
              </div>
              <Link
                href="/vozila"
                className="hidden md:flex items-center gap-1.5 text-sm font-bold text-primary hover:opacity-75 transition-opacity"
              >
                Sva vozila <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-muted-foreground mb-10 max-w-xl">
              Ručno odabrana vozila s garantovanim kilometrima i kompletnom servisnom dokumentacijom.
            </p>

            {vehicles && vehicles.length > 0 ? (
              <VehicleTabs vehicles={vehicles as Vehicle[]} />
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Trenutno nema dostupnih vozila. Pogledajte uskoro.</p>
              </div>
            )}

            <div className="mt-8 md:hidden text-center">
              <Link
                href="/vozila"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-primary"
              >
                Sva vozila <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── ZAŠTO MI ── */}
        <section className="py-20 px-4 bg-card border-y border-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
                Zašto mi
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-foreground">
                Izgradili smo povjerenje
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Zaradili smo povjerenje hiljada kupaca kroz transparentnost, kvalitet i izvrsnu uslugu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {TRUST_CARDS.map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-background rounded-2xl border border-border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-4">{icon}</div>
                  <h3 className="font-bold text-base mb-2 text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RECENZIJE ── */}
        {testimonials && testimonials.length > 0 && (
          <section className="py-20 px-4 bg-background">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
                  Utisci kupaca
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-foreground">
                  Šta kažu naši kupci
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(testimonials as Testimonial[]).map((t) => (
                  <div key={t.id} className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-5">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                        {t.customer_name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{t.customer_name}</p>
                        {t.vehicle_purchased && (
                          <p className="text-xs text-muted-foreground">{t.vehicle_purchased}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── BLOG PREVIEW ── */}
        {news && news.length > 0 && (
          <section className="py-20 px-4 bg-card border-y border-border">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
                    Vijesti i savjeti
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black text-foreground">
                    Iz našeg bloga
                  </h2>
                </div>
                <Link
                  href="/vijesti"
                  className="hidden md:flex items-center gap-1.5 text-sm font-bold text-primary hover:opacity-75 transition-opacity"
                >
                  Sve vijesti <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(news as NewsArticle[]).map((n) => (
                  <Link key={n.id} href={`/vijesti/${n.slug}`} className="group">
                    <div className="bg-background rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                      {n.featured_image ? (
                        <img
                          src={n.featured_image}
                          alt={n.title}
                          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-44 bg-secondary" />
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                          {n.category}
                        </p>
                        <h3 className="font-bold text-sm leading-snug mb-2 line-clamp-2 text-foreground">
                          {n.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                          {n.excerpt}
                        </p>
                        <p className="text-xs font-bold text-primary mt-3">
                          Čitaj više →
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA BANNER ── */}
        <section className="py-24 px-4 text-center text-white bg-navy">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">
              Bez pritiska, ikada
            </p>
            <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight">
              Spremi za probnu vožnju?
            </h2>
            <p className="text-white/55 mb-8 leading-relaxed max-w-md mx-auto">
              Rezervišite besplatnu probnu vožnju. Isprobajte bilo koje vozilo u naše
              radno vrijeme — po vašem rasporedu.
            </p>
            <Link
              href="/vozila"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Zakaži probnu vožnju
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
