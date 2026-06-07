"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Inquiry } from "@/types/database";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, User, Phone, Mail, Car } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-primary/20 text-primary border-primary/30",
  closed: "bg-secondary text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Novo", contacted: "Kontaktirano", in_progress: "U toku", closed: "Zatvoreno",
};

export default function AdminInquiries() {
  const supabase = createClient();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
    setInquiries(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string | null, status: string) => {
    if (!id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("inquiries").update({ status } as any).eq("id", id);
    if (error) { toast.error("Greška"); return; }
    toast.success("Status ažuriran");
    load();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black">Upiti</h1>
        <p className="text-sm text-muted-foreground">{inquiries.length} upita ukupno</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nema upita.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <Card key={inq.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start gap-4 justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <Badge className={STATUS_COLORS[inq.status]}>{STATUS_LABELS[inq.status]}</Badge>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="w-3.5 h-3.5" /> {inq.customer_name}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" /> {inq.customer_email}
                      </div>
                      {inq.customer_phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" /> {inq.customer_phone}
                        </div>
                      )}
                      {inq.vehicle_name && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Car className="w-3.5 h-3.5" /> {inq.vehicle_name}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground bg-secondary px-3 py-2 rounded-md">{inq.message}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(inq.created_at ?? ""), "dd.MM.yyyy HH:mm")}
                    </p>
                    <Select value={inq.status} onValueChange={(v) => updateStatus(inq.id ?? "", v ?? "")}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Novo</SelectItem>
                        <SelectItem value="contacted">Kontaktirano</SelectItem>
                        <SelectItem value="in_progress">U toku</SelectItem>
                        <SelectItem value="closed">Zatvoreno</SelectItem>
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
