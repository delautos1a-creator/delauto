"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Booking } from "@/types/database";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, Phone, Mail, Car } from "lucide-react";
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

export default function AdminBookings() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    setBookings(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string | null, status: string) => {
    if (!id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("bookings").update({ status } as any).eq("id", id);
    if (error) { toast.error("Greška"); return; }
    toast.success("Status ažuriran");
    load();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black">Rezervacije</h1>
        <p className="text-sm text-muted-foreground">{bookings.length} rezervacija ukupno</p>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
