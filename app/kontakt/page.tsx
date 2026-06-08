"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Building2, Car } from "lucide-react";

function ContactForm() {
  const params = useSearchParams();
  const vehicleName = params.get("vozilo") ?? "";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(vehicleName ? `Zainteresovan/a sam za: ${vehicleName}` : "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSending(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("inquiries").insert({
      customer_name: name,
      customer_email: email,
      customer_phone: phone || null,
      message,
      vehicle_name: vehicleName || null,
      status: "new",
    } as any);
    setSending(false);
    if (error) { toast.error("Greška pri slanju. Pokušajte ponovo."); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-foreground">Hvala na upitu!</h3>
        <p className="text-muted-foreground">Javit ćemo vam se u najkraćem mogućem roku.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Ime i prezime *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vaše ime i prezime" required className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Broj telefona</Label>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+387 61 000 000" className="rounded-xl" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Email adresa *</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vas@email.com" required className="rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label>Poruka *</Label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Kako vam možemo pomoći?" rows={5} required className="rounded-xl resize-none" />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {sending ? "Slanje..." : "Pošalji poruku"}
      </button>
    </form>
  );
}

export default function KontaktPage() {
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
                    <a href="tel:+38761199645" className="text-sm font-medium hover:text-primary transition-colors">+387 61 199 645</a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Email</p>
                    <a href="mailto:info@delauto.ba" className="text-sm font-medium hover:text-primary transition-colors">info@delauto.ba</a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Radno vrijeme</p>
                    <p className="text-sm font-medium">Pon – Pet: 09:00 – 18:00</p>
                    <p className="text-sm text-white/60">Sub: 09:00 – 14:00</p>
                    <p className="text-sm text-red-400/80 mt-0.5">Ned: Zatvoreno</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10" />

              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Pratite nas</p>
                <div className="flex gap-2.5">
                  <a href="https://www.instagram.com/delauto_sarajevo/" target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors" aria-label="Instagram">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  </a>
                  <a href="https://olx.ba/shops/DelAuto/" target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-white font-black text-[11px] tracking-tight" aria-label="OLX">
                    OLX
                  </a>
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
                  <p className="text-sm text-muted-foreground mt-1">Paromlinska 53e, Office</p>
                  <p className="text-sm text-muted-foreground">71000 Sarajevo, Bosna i Hercegovina</p>
                  <a href="tel:+38761199645" className="text-sm text-primary font-semibold mt-1.5 block hover:opacity-75 transition-opacity">
                    +387 61 199 645
                  </a>
                </div>
              </div>
              <iframe
                title="Del Auto Ured — Paromlinska 53e"
                src="https://maps.google.com/maps?q=Paromlinska+53e,+Sarajevo,+Bosnia+and+Herzegovina&output=embed&z=17&hl=bs"
                width="100%"
                height="260"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Showroom + car wash */}
            <div className="rounded-2xl overflow-hidden border border-border">
              <div className="bg-card px-6 py-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">Salon i autopraonica</p>
                  <h3 className="font-black text-foreground">DEL AUTO Prodaja vozila</h3>
                  <p className="text-sm text-muted-foreground mt-1">Džemala Bijedića br. 168</p>
                  <p className="text-sm text-muted-foreground">71000 Sarajevo, Bosna i Hercegovina</p>
                  <a href="tel:+38761199645" className="text-sm text-primary font-semibold mt-1.5 block hover:opacity-75 transition-opacity">
                    +387 61 199 645
                  </a>
                </div>
              </div>
              <iframe
                title="Del Auto Salon — Džemala Bijedića 168"
                src="https://maps.google.com/maps?q=43.846429,18.339670&output=embed&z=17&hl=bs"
                width="100%"
                height="260"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
