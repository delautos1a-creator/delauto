"use client";

import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, CheckCircle2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isBefore, startOfToday, isSunday } from "date-fns";
import { toast } from "sonner";

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

interface Props {
  open: boolean;
  onClose: () => void;
  vehicleId?: string;
  vehicleName?: string;
}

type Step = "date" | "time" | "form" | "done";

export default function BookingModal({ open, onClose, vehicleId, vehicleName }: Props) {
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset on close
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep("date");
      setSelectedDate(undefined);
      setSelectedTime(null);
      setTakenSlots([]);
      setName(""); setEmail(""); setPhone(""); setMessage("");
    }, 300);
  };

  // Fetch taken slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    fetch(`/api/bookings?date=${dateStr}`)
      .then((r) => r.json())
      .then(({ taken }) => setTakenSlots(taken ?? []))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedTime(null);
    setStep("time");
  };

  const handleTimeSelect = (slot: string) => {
    setSelectedTime(slot);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle_id: vehicleId ?? null,
        vehicle_name: vehicleName ?? null,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        preferred_date: format(selectedDate, "yyyy-MM-dd"),
        preferred_time: selectedTime,
        message: message || null,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      const isEmailConflict = res.headers.get("x-conflict") === "email";
      toast.error(data.error ?? "Greška. Pokušajte ponovo.", { duration: 6000 });
      if (res.status === 409 && !isEmailConflict) {
        setStep("time");
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        fetch(`/api/bookings?date=${dateStr}`)
          .then((r) => r.json())
          .then(({ taken }) => setTakenSlots(taken ?? []));
      }
      return;
    }

    setStep("done");
  };

  const today = startOfToday();

  const stepTitle: Record<Step, string> = {
    date: "Odaberite datum",
    time: "Odaberite termin",
    form: "Vaši podaci",
    done: "Rezervacija poslana",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {vehicleName ? `Test vožnja — ${vehicleName}` : "Zakaži test vožnju"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        {step !== "done" && (
          <div className="flex items-center gap-2 mb-2">
            {(["date", "time", "form"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  step === s ? "bg-primary text-primary-foreground" :
                  ["date", "time", "form"].indexOf(step) > i ? "bg-primary/30 text-primary" :
                  "bg-secondary text-muted-foreground"
                )}>
                  {i + 1}
                </div>
                {i < 2 && <div className="flex-1 h-px bg-border w-8" />}
              </div>
            ))}
            <span className="text-sm text-muted-foreground ml-2">{stepTitle[step]}</span>
          </div>
        )}

        {/* STEP 1: Date */}
        {step === "date" && (
          <div className="flex justify-center">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={[
                { before: today },
                (date) => isSunday(date),
              ]}
              classNames={{
                selected: "!bg-primary !text-primary-foreground rounded-lg",
                today: "font-bold underline",
                disabled: "opacity-30 cursor-not-allowed",
              }}
            />
          </div>
        )}

        {/* STEP 2: Time slots */}
        {step === "time" && selectedDate && (
          <div>
            <button
              onClick={() => setStep("date")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {format(selectedDate, "dd.MM.yyyy")}
            </button>
            {loadingSlots ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Učitavanje termina...</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const taken = takenSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      disabled={taken}
                      onClick={() => handleTimeSelect(slot)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-3 rounded-lg text-sm font-medium border transition-all",
                        taken
                          ? "bg-secondary/50 border-border text-muted-foreground/40 cursor-not-allowed line-through"
                          : "border-border hover:border-primary hover:bg-primary/5 cursor-pointer"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Prekriženi termini su već zauzeti. Radimo Pon–Sub.
            </p>
          </div>
        )}

        {/* STEP 3: Contact form */}
        {step === "form" && selectedDate && selectedTime && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="bg-secondary rounded-lg px-3 py-2.5 text-sm flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {format(selectedDate, "dd.MM.yyyy")}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {selectedTime}
              </div>
              <button
                type="button"
                onClick={() => setStep("time")}
                className="ml-auto text-xs text-primary hover:underline"
              >
                Promijeni
              </button>
            </div>

            <div className="space-y-1">
              <Label>Ime i prezime *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vaše ime i prezime"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.com"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Telefon *</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+387 61 000 000"
                required
              />
              <p className="text-xs text-muted-foreground">Kontaktiraćemo vas radi potvrde.</p>
            </div>
            <div className="space-y-1">
              <Label>Napomena</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Eventualna pitanja ili napomene..."
                rows={2}
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Slanje..." : "Pošalji zahtjev za test vožnju"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Dobićete email potvrdu nakon što admin odobri vašu rezervaciju.
            </p>
          </form>
        )}

        {/* STEP 4: Done */}
        {step === "done" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Zahtjev poslan!</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Vaš zahtjev za test vožnju je primljen.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Kontaktiraćemo vas na <strong>{email}</strong> čim odobrimo termin.
            </p>
            <Button onClick={handleClose} className="w-full">Zatvori</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
