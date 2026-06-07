"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function ContactForm() {
  const params = useSearchParams();
  const vehicleName = params.get("vozilo") ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
    toast.success("Upit uspješno poslan!");
  };

  if (sent) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Hvala na upitu!</h2>
        <p className="text-muted-foreground">Javit ćemo vam se u najkraćem mogućem roku.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Ime i prezime *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Email *</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Telefon</Label>
        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+387..." />
      </div>
      <div className="space-y-1">
        <Label>Poruka *</Label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} required />
      </div>
      <Button type="submit" disabled={sending} size="lg">
        {sending ? "Slanje..." : "Pošalji upit"}
      </Button>
    </form>
  );
}

export default function KontaktPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Kontakt</h1>
          <p className="text-muted-foreground">Pošaljite nam upit i javit ćemo vam se.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Suspense fallback={<div>Učitavanje...</div>}>
            <ContactForm />
          </Suspense>
          <div className="space-y-6 text-sm text-muted-foreground">
            <div>
              <h3 className="font-bold text-foreground mb-2">Lokacija</h3>
              <p>Sarajevo, Bosna i Hercegovina</p>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">Kontakt</h3>
              <p>info@delauto.ba</p>
              <p>+387 61 000 000</p>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">Radno vrijeme</h3>
              <p>Pon–Pet: 09:00–18:00</p>
              <p>Sub: 09:00–14:00</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
