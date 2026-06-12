"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";

export default function ContactForm() {
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
