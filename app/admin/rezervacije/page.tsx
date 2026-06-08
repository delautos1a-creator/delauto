"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Booking } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, Phone, Mail, Car, Plus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-primary/20 text-primary border-primary/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Novo", confirmed: "Potvrđeno", completed: "Završeno", cancelled: "Otkazano",
};

const TYPE_LABELS: Record<string, string> = {
  test_drive: "Test vožnja", showroom_viewing: "Razgledanje", video_viewing: "Video",
};

const schema = z.object({
  customer_name: z.string().min(1, "Obavezno"),
  customer_email: z.string().email("Unesite validan email"),
  customer_phone: z.string().min(1, "Obavezno"),
  type: z.enum(["test_drive", "showroom_viewing", "video_viewing"]),
  vehicle_name: z.string().optional(),
  preferred_date: z.string().min(1, "Obavezno"),
  preferred_time: z.string().min(1, "Obavezno"),
  message: z.string().optional(),
  status: z.enum(["new", "confirmed", "completed", "cancelled"]),
});

type FormData = z.infer<typeof schema>;

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

export default function AdminBookings() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "test_drive", status: "confirmed" },
  });

  const load = async () => {
    const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    setBookings(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    reset({ type: "test_drive", status: "confirmed" });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const payload = {
      ...data,
      vehicle_name: data.vehicle_name || null,
      message: data.message || null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("bookings").insert(payload as any);
    setSaving(false);
    if (error) { toast.error("Greška pri čuvanju"); return; }
    toast.success("Rezervacija dodana");
    setOpen(false);
    load();
  };

  const updateStatus = async (id: string | null, status: string) => {
    if (!id) return;

    if (status === "confirmed") {
      // API route updates DB + sends confirmation email to customer
      const res = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id }),
      });
      if (!res.ok) { toast.error("Greška pri potvrdi"); return; }
      toast.success("Rezervacija potvrđena — email poslan kupcu ✅");
    } else if (status === "cancelled") {
      // API route updates DB + sends rejection email to customer
      const res = await fetch("/api/bookings/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id }),
      });
      if (!res.ok) { toast.error("Greška pri otkazivanju"); return; }
      toast.success("Rezervacija odbijena — email poslan kupcu");
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("bookings").update({ status } as any).eq("id", id);
      if (error) { toast.error("Greška"); return; }
      toast.success("Status ažuriran");
    }
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Obrisati rezervaciju?")) return;
    await supabase.from("bookings").delete().eq("id", id);
    toast.success("Rezervacija obrisana");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Rezervacije</h1>
          <p className="text-sm text-muted-foreground">{bookings.length} rezervacija ukupno</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Dodaj rezervaciju
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nema rezervacija.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start gap-4 justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={STATUS_COLORS[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                      <Badge variant="outline">{TYPE_LABELS[b.type] ?? b.type}</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="w-3.5 h-3.5" /> {b.customer_name}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" /> {b.customer_email}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" /> {b.customer_phone}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" /> {b.preferred_date}
                        {b.preferred_time && ` u ${b.preferred_time}`}
                      </div>
                      {b.vehicle_name && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Car className="w-3.5 h-3.5" /> {b.vehicle_name}
                        </div>
                      )}
                    </div>
                    {b.message && (
                      <p className="text-sm text-muted-foreground bg-secondary px-3 py-2 rounded-md">{b.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(b.created_at ?? ""), "dd.MM.yyyy HH:mm")}
                    </p>
                    <Select value={b.status} onValueChange={(v) => updateStatus(b.id ?? "", v ?? "")}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Novo</SelectItem>
                        <SelectItem value="confirmed">Potvrđeno</SelectItem>
                        <SelectItem value="completed">Završeno</SelectItem>
                        <SelectItem value="cancelled">Otkazano</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 hover:text-red-300 w-36 h-8 text-xs"
                      onClick={() => del(b.id ?? "")}
                    >
                      Obriši
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dodaj rezervaciju</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Tip rezervacije</Label>
                <Controller name="type" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test_drive">Test vožnja</SelectItem>
                      <SelectItem value="showroom_viewing">Razgledanje</SelectItem>
                      <SelectItem value="video_viewing">Video pregled</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Ime i prezime *</Label>
                <Input {...register("customer_name")} placeholder="npr. Amar Hodžić" />
                {errors.customer_name && <p className="text-xs text-red-500">{errors.customer_name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input {...register("customer_email")} type="email" placeholder="amar@email.com" />
                {errors.customer_email && <p className="text-xs text-red-500">{errors.customer_email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Telefon *</Label>
                <Input {...register("customer_phone")} placeholder="+387 61 000 000" />
                {errors.customer_phone && <p className="text-xs text-red-500">{errors.customer_phone.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Datum *</Label>
                <Input {...register("preferred_date")} type="date" />
                {errors.preferred_date && <p className="text-xs text-red-500">{errors.preferred_date.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Termin *</Label>
                <Controller name="preferred_time" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Odaberite" /></SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.preferred_time && <p className="text-xs text-red-500">{errors.preferred_time.message}</p>}
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Vozilo</Label>
                <Input {...register("vehicle_name")} placeholder="npr. BMW X5 2022" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Status</Label>
                <Controller name="status" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="confirmed">Potvrđeno</SelectItem>
                      <SelectItem value="completed">Završeno</SelectItem>
                      <SelectItem value="cancelled">Otkazano</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Napomena</Label>
                <Textarea {...register("message")} rows={2} placeholder="Eventualne napomene..." />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Čuvanje..." : "Dodaj rezervaciju"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Odustani</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
