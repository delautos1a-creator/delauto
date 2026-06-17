"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import type { Testimonial } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Star, Trash2, Plus, Copy, Printer, QrCode } from "lucide-react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const REVIEW_URL = "https://delauto.ba/recenzija";

function QRSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, REVIEW_URL, {
        width: 160,
        margin: 2,
        color: { dark: "#ffffff", light: "#1a1a2e" },
      });
    }
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(REVIEW_URL);
    toast.success("Link kopiran");
  };

  const printQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Del Auto – QR Recenzija</title>
      <style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#fff;color:#111;}
      img{width:220px;height:220px;}p{margin-top:12px;font-size:14px;color:#555;}</style></head>
      <body><img src="${canvas.toDataURL()}"/><p>${REVIEW_URL}</p></body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <Card className="border-border mb-6">
      <CardContent className="p-5">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="bg-[#1a1a2e] rounded-xl p-2 shrink-0">
            <canvas ref={canvasRef} className="rounded-lg block" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Link za recenzije</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Podijelite ovaj QR kod ili link sa kupcima — recenzija se odmah šalje i čeka vašu potvrdu.
            </p>
            <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2 mb-3">
              <span className="text-xs font-mono text-primary truncate flex-1">{REVIEW_URL}</span>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={copyLink}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={printQR}>
              <Printer className="w-3.5 h-3.5" /> Printaj QR
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const schema = z.object({
  customer_name: z.string().min(1, "Obavezno"),
  rating: z.coerce.number().min(1).max(5),
  text: z.string().min(1, "Obavezno"),
  vehicle_purchased: z.string().optional(),
  date: z.string().optional(),
  is_approved: z.boolean(),
  is_featured: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function AdminTestimonials() {
  const supabase = createClient();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { rating: 5, is_approved: true, is_featured: false },
  });

  const load = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
    setTestimonials(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    reset({ rating: 5, is_approved: true, is_featured: false });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const payload = {
      ...data,
      vehicle_purchased: data.vehicle_purchased || null,
      date: data.date || new Date().toISOString().split("T")[0],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("testimonials").insert(payload as any);
    setSaving(false);
    if (error) { toast.error("Greška pri čuvanju"); return; }
    toast.success("Recenzija dodana");
    setOpen(false);
    load();
  };

  const toggle = async (id: string, field: "is_approved" | "is_featured", value: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("testimonials").update({ [field]: value } as any).eq("id", id);
    if (error) { toast.error("Greška"); return; }
    toast.success("Ažurirano");
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Obrisati recenziju?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    toast.success("Recenzija obrisana");
    load();
  };

  return (
    <div>
      <QRSection />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Recenzije</h1>
          <p className="text-sm text-muted-foreground">{testimonials.length} recenzija ukupno</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Dodaj recenziju
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nema recenzija.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => (
            <Card key={t.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{t.customer_name}</p>
                      {!t.is_approved && <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">Na čekanju</Badge>}
                      {t.is_featured && <Badge className="bg-primary/20 text-primary border-primary/30">Istaknuto</Badge>}
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    {t.vehicle_purchased && <p className="text-xs text-muted-foreground mb-1">Kupio: {t.vehicle_purchased}</p>}
                    <p className="text-sm text-muted-foreground">{t.text}</p>
                  </div>
                  <div className="flex flex-col gap-3 items-end shrink-0">
                    <Button size="sm" variant="outline" className="text-red-400" onClick={() => del(t.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Odobri</Label>
                      <Switch checked={t.is_approved} onCheckedChange={(v) => toggle(t.id, "is_approved", v)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Istakni</Label>
                      <Switch checked={t.is_featured} onCheckedChange={(v) => toggle(t.id, "is_featured", v)} />
                    </div>
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
            <DialogTitle>Dodaj recenziju</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Ime kupca *</Label>
              <Input {...register("customer_name")} placeholder="npr. Amar Hodžić" />
              {errors.customer_name && <p className="text-xs text-red-500">{errors.customer_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Ocjena *</Label>
              <Controller name="rating" control={control} render={({ field }) => (
                <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {"★".repeat(n)}{"☆".repeat(5 - n)} ({n}/5)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1">
              <Label>Tekst recenzije *</Label>
              <Textarea {...register("text")} rows={3} placeholder="Odlična usluga, preporučujem..." />
              {errors.text && <p className="text-xs text-red-500">{errors.text.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Kupljeno vozilo</Label>
              <Input {...register("vehicle_purchased")} placeholder="npr. BMW X5 2022" />
            </div>
            <div className="space-y-1">
              <Label>Datum</Label>
              <Input {...register("date")} type="date" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Controller name="is_approved" control={control} render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} id="approved" />
                )} />
                <Label htmlFor="approved">Odobri odmah</Label>
              </div>
              <div className="flex items-center gap-2">
                <Controller name="is_featured" control={control} render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} id="featured" />
                )} />
                <Label htmlFor="featured">Istakni</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Čuvanje..." : "Dodaj recenziju"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Odustani</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
