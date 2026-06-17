"use client";

import { useState } from "react";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RecenzijaPage() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const textLen = text.trim().length;
  const canSubmit = rating > 0 && name.trim().length >= 2 && textLen >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          rating,
          text: text.trim(),
          vehicle_purchased: vehicle.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Greška. Pokušajte ponovo."); return; }
      setDone(true);
    } catch {
      setError("Greška. Pokušajte ponovo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-black mb-3">Hvala na recenziji!</h1>
          <p className="text-muted-foreground leading-relaxed">
            Vaša recenzija je primljena i bit će objavljena nakon što je pregledamo.
            Cijeniomo vaše povjerenje.
          </p>
          <div className="flex justify-center gap-1 mt-6">
            {Array.from({ length: rating }).map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-10">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-7 h-7 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <h1 className="text-2xl font-black mb-2">Ostavite recenziju</h1>
          <p className="text-muted-foreground text-sm">
            Del Auto — Hvala što ste nam ukazali povjerenje.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-2xl p-6">
          {/* Star rating */}
          <div className="space-y-2">
            <Label>Ocjena *</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                  aria-label={`${n} zvjezdica`}
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      n <= (hovered || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/20"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating === 0 && (
              <p className="text-xs text-muted-foreground">Kliknite na zvjezdicu za ocjenu</p>
            )}
            {rating > 0 && (
              <p className="text-xs text-primary font-medium">
                {["", "Loše", "Zadovoljava", "Dobro", "Odlično", "Izvrsno!"][rating]}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Ime i prezime *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[<>&"'{}[\]\\^~`|]/g, ""))}
              placeholder="npr. Amar Hodžić"
              maxLength={120}
              autoComplete="name"
            />
            {name.trim().length > 0 && name.trim().length < 2 && (
              <p className="text-xs text-red-400">Minimalno 2 znaka</p>
            )}
          </div>

          {/* Review text */}
          <div className="space-y-1.5">
            <Label htmlFor="text">Recenzija *</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Napišite vaš utisak o kupovini ili usluzi..."
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <div className="flex justify-between">
              {textLen > 0 && textLen < 10 && (
                <p className="text-xs text-red-400">Minimalno 10 znakova ({10 - textLen} još)</p>
              )}
              {textLen >= 10 && <span />}
              <p className={`text-xs ml-auto ${textLen > 900 ? "text-yellow-400" : "text-muted-foreground/50"}`}>
                {textLen}/1000
              </p>
            </div>
          </div>

          {/* Vehicle (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="vehicle">
              Kupljeno vozilo <span className="text-muted-foreground font-normal">(nije obavezno)</span>
            </Label>
            <Input
              id="vehicle"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value.replace(/[<>&"']/g, ""))}
              placeholder="npr. BMW X5 2022"
              maxLength={100}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 px-3 py-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting || !canSubmit} className="w-full">
            {submitting ? "Slanje..." : "Pošalji recenziju"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Recenzija će biti objavljena nakon provjere.
          </p>
        </form>
      </div>
    </div>
  );
}
