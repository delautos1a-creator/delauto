"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Inquiry } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, User, Phone, Mail, Car, Plus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const schema = z.object({
  customer_name: z.string().min(1, "Obavezno"),
  customer_email: z.string().email("Unesite validan email"),
  customer_phone: z.string().optional(),
  vehicle_name: z.string().optional(),
  message: z.string().min(1, "Obavezno"),
  status: z.enum(["new", "contacted", "in_progress", "closed"]),
});

type FormData = z.infer<typeof schema>;

export default function AdminInquiries() {
  const supabase = createClient();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "new" },
  });

  const load = async () => {
    const { data } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
    setInquiries(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    reset({ status: "new" });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const payload = {
      ...data,
      customer_phone: data.customer_phone || null,
      vehicle_name: data.vehicle_name || null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("inquiries").insert(payload as any);
    setSaving(false);
    if (error) { toast.error("Greška pri čuvanju"); return; }
    toast.success("Upit dodan");
    setOpen(false);
    load();
  };

  const updateStatus = async (id: string | null, status: string) => {
    if (!id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("inquiries").update({ status } as any).eq("id", id);
    if (error) { toast.error("Greška"); return; }
    toast.success("Status ažuriran");
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Obrisati upit?")) return;
    await supabase.from("inquiries").delete().eq("id", id);
    toast.success("Upit obrisan");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Upiti</h1>
          <p className="text-sm text-muted-foreground">{inquiries.length} upita ukupno</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Dodaj upit
        </Button>
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 hover:text-red-300 w-36 h-8 text-xs"
                      onClick={() => del(inq.id ?? "")}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dodaj upit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Ime i prezime *</Label>
              <Input {...register("customer_name")} placeholder="npr. Amar Hodžić" />
              {errors.customer_name && <p className="text-xs text-red-500">{errors.customer_name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input {...register("customer_email")} type="email" placeholder="amar@email.com" />
                {errors.customer_email && <p className="text-xs text-red-500">{errors.customer_email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Telefon</Label>
                <Input {...register("customer_phone")} placeholder="+387 61 000 000" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Vozilo od interesa</Label>
              <Input {...register("vehicle_name")} placeholder="npr. BMW X5 2022" />
            </div>
            <div className="space-y-1">
              <Label>Poruka *</Label>
              <Textarea {...register("message")} rows={3} placeholder="Zainteresovan/a za..." />
              {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Controller name="status" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="contacted">Kontaktirano</SelectItem>
                    <SelectItem value="in_progress">U toku</SelectItem>
                    <SelectItem value="closed">Zatvoreno</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Čuvanje..." : "Dodaj upit"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Odustani</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
