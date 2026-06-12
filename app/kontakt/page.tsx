import { Suspense } from "react";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import ContactForm from "@/components/public/contact-form";
import { getSiteSettings } from "@/lib/settings";
import { MapPin, Phone, Mail, Clock, Building2, Car } from "lucide-react";

export const metadata = { title: "Kontakt — Del Auto" };

export default async function KontaktPage() {
  const s = await getSiteSettings();
  const hours = s.site_working_hours.split("\n");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-navy text-white py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">Uvijek dostupni</p>
            <h1 className="text-4xl md:text-5xl font-black mb-3">Kontaktirajte nas</h1>
            <p className="text-white/55">Naš tim je spreman pomoći vam pronaći savršeno vozilo.</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-14 space-y-10">

          {/* ── Top row: info + form ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Info card */}
            <div className="bg-navy text-white rounded-2xl p-8 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-black mb-1">Kontakt informacije</h2>
                <p className="text-white/50 text-sm">Posjetite nas ili nas kontaktirajte online.</p>
              </div>

              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Telefon</p>
                    <a href={`tel:${s.site_phone.replace(/\s/g, "")}`} className="text-sm font-medium hover:text-primary transition-colors">
                      {s.site_phone}
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Email</p>
                    <a href={`mailto:${s.site_email}`} className="text-sm font-medium hover:text-primary transition-colors">
                      {s.site_email}
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Radno vrijeme</p>
                    {hours.map((line, i) => (
                      <p key={i} className={`text-sm ${i === hours.length - 1 && /zatvoreno/i.test(line) ? "text-red-400/80 mt-0.5" : i > 0 ? "text-white/60" : "font-medium"}`}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Lokacije</p>
                    <p className="text-sm text-white/80">{s.site_address}</p>
                    <p className="text-sm text-white/55 mt-0.5">{s.site_address_showroom}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10" />

              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Pratite nas</p>
                <div className="flex gap-2.5">
                  {s.site_instagram && (
                    <a href={s.site_instagram} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors" aria-label="Instagram">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5"/>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                      </svg>
                    </a>
                  )}
                  {s.site_olx && (
                    <a href={s.site_olx} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-white font-black text-[11px] tracking-tight" aria-label="OLX">
                      OLX
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
              <h2 className="text-xl font-black text-foreground mb-1">Pošaljite nam poruku</h2>
              <p className="text-muted-foreground text-sm mb-6">Odgovaramo u roku od 24 sata.</p>
              <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Učitavanje...</div>}>
                <ContactForm />
              </Suspense>
            </div>
          </div>

          {/* ── Two locations with maps ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Office */}
            <div className="rounded-2xl overflow-hidden border border-border">
              <div className="bg-card px-6 py-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">Ured</p>
                  <h3 className="font-black text-foreground">DEL AUTO d.o.o.</h3>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{s.site_address}</p>
                  <a href={`tel:${s.site_phone.replace(/\s/g, "")}`} className="text-sm text-primary font-semibold mt-1.5 block hover:opacity-75 transition-opacity">
                    {s.site_phone}
                  </a>
                </div>
              </div>
              {s.site_maps_office && (
                <iframe
                  title="Del Auto Ured"
                  src={s.site_maps_office}
                  width="100%"
                  height="260"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>

            {/* Showroom */}
            <div className="rounded-2xl overflow-hidden border border-border">
              <div className="bg-card px-6 py-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">Salon i autopraonica</p>
                  <h3 className="font-black text-foreground">DEL AUTO Prodaja vozila</h3>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{s.site_address_showroom}</p>
                  <a href={`tel:${s.site_phone.replace(/\s/g, "")}`} className="text-sm text-primary font-semibold mt-1.5 block hover:opacity-75 transition-opacity">
                    {s.site_phone}
                  </a>
                </div>
              </div>
              {s.site_maps_showroom && (
                <iframe
                  title="Del Auto Salon"
                  src={s.site_maps_showroom}
                  width="100%"
                  height="260"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
