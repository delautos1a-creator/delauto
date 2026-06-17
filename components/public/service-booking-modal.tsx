"use client";

import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, CheckCircle2, ChevronLeft, ConciergeBell } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isBefore, startOfToday, parseISO } from "date-fns";
import { toast } from "sonner";

const ALL_SLOTS = [
  "07:00","08:00","09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00","17:00","18:00","19:00",
];

interface Props {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  scheduleFrom: string | null;
  scheduleTo: string | null;
  timeFrom: string;
  timeTo: string;
  allowWeekdays: boolean;
  allowSaturday: boolean;
  allowSunday: boolean;
}

type Step = "date" | "time" | "form" | "done";

export default function ServiceBookingModal({
  open, onClose,
  serviceId, serviceName,
  scheduleFrom, scheduleTo,
  timeFrom, timeTo,
  allowWeekdays, allowSaturday, allowSunday,
}: Props) {
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

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    fetch(`/api/bookings?date=${format(selectedDate, "yyyy-MM-dd")}`)
      .then((r) => r.json())
      .then(({ taken }) => setTakenSlots(taken ?? []))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  const today = startOfToday();
  const from = scheduleFrom ? parseISO(scheduleFrom) : null;
  const to = scheduleTo ? parseISO(scheduleTo) : null;

  // Slots filtered to this service's working hours (strip seconds from DB values)
  const tfNorm = timeFrom.slice(0, 5);
  const ttNorm = timeTo.slice(0, 5);
  const availableSlots = ALL_SLOTS.filter((s) => s >= tfNorm && s <= ttNorm);

  const isDayDisabled = (date: Date) => {
    const dow = date.getDay(); // 0=Sun, 1=Mon … 6=Sat
    if (dow === 0 && !allowSunday) return true;
    if (dow === 6 && !allowSaturday) return true;
    if (dow >= 1 && dow <= 5 && !allowWeekdays) return true;
    return false;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedTime(null);
    setStep("time");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    const res = await fetch("/api/service-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        service_name: serviceName,
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
      toast.error(data.error ?? "Greška. Pokušajte ponovo.", { duration: 6000 });
      if (res.status === 409) {
        setStep("time");
        fetch(`/api/bookings?date=${format(selectedDate, "yyyy-MM-dd")}`)
          .then((r) => r.json())
          .then(({ taken }) => setTakenSlots(taken ?? []));
      }
      return;
    }
    setStep("done");
  };

  const stepTitle: Record<Step, string> = {
    date: "Odaberite datum", time: "Odaberite termin", form: "Vaši podaci", done: "Zahtjev poslan",
  };

  // Build disabled rules for DayPicker
  const disabledRules: Parameters<typeof DayPicker>[0]["disabled"] = [
    { before: from && isBefore(from, today) ? today : (from ?? today) },
    ...(to ? [{ after: to }] : []),
    isDayDisabled,
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ConciergeBell className="w-5 h-5 text-primary" />
            {serviceName}
          </DialogTitle>
        </DialogHeader>

        {step !== "done" && (
          <div className="flex items-center gap-2 mb-2">
            {(["date", "time", "form"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  step === s ? "bg-primary text-primary-foreground" :
                  ["date","time","form"].indexOf(step) > i ? "bg-primary/30 text-primary" :
                  "bg-secondary text-muted-foreground"
                )}>{i + 1}</div>
                {i < 2 && <div className="flex-1 h-px bg-border w-8" />}
              </div>
            ))}
            <span className="text-sm text-muted-foreground ml-2">{stepTitle[step]}</span>
          </div>
        )}

        {/* STEP 1: Date */}
        {step === "date" && (
          <div>
            {(scheduleFrom || scheduleTo) && (
              <p className="text-xs text-muted-foreground text-center mb-3">
                {scheduleFrom && scheduleTo
                  ? `Dostupno od ${scheduleFrom} do ${scheduleTo}`
                  : scheduleFrom
                  ? `Dostupno od ${scheduleFrom}`
                  : `Dostupno do ${scheduleTo}`}
              </p>
            )}
            <div className="flex justify-center">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={disabledRules}
                classNames={{
                  selected: "!bg-primary !text-primary-foreground rounded-lg",
                  today: "font-bold underline",
                  disabled: "opacity-30 cursor-not-allowed",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Radno: {tfNorm}–{ttNorm}
              {allowWeekdays && " · Pon–Pet"}
              {allowSaturday && " · Sub"}
              {allowSunday && " · Ned"}
            </p>
          </div>
        )}

        {/* STEP 2: Time slots */}
        {step === "time" && selectedDate && (
          <div>
            <button onClick={() => setStep("date")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              {format(selectedDate, "dd.MM.yyyy")}
            </button>
            {loadingSlots ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Učitavanje termina...</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => {
                  const taken = takenSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      disabled={taken}
                      onClick={() => { setSelectedTime(slot); setStep("form"); }}
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
              <button type="button" onClick={() => setStep("time")} className="ml-auto text-xs text-primary hover:underline">
                Promijeni
              </button>
            </div>
            <div className="space-y-1">
              <Label>Ime i prezime *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vaše ime i prezime" required />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vas@email.com" required />
            </div>
            <div className="space-y-1">
              <Label>Telefon *</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s\-().]/g, ""))} placeholder="+387 61 000 000" maxLength={25} required />
              <p className="text-xs text-muted-foreground">Kontaktiraćemo vas radi potvrde.</p>
            </div>
            <div className="space-y-1">
              <Label>Napomena</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Eventualna pitanja..." rows={2} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Slanje..." : "Pošalji zahtjev"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Dobićete email potvrdu čim admin odobri vaš termin.
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
            <p className="text-sm text-muted-foreground mb-6">
              Vaš zahtjev za <strong>{serviceName}</strong> je primljen. Kontaktiraćemo vas telefonom ili emailom i potvrditi termin.
            </p>
            <Button onClick={handleClose} className="w-full">Zatvori</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
