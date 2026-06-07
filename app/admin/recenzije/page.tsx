"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Testimonial } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminTestimonials() {
  const supabase = createClient();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
    setTestimonials(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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
      <div className="mb-6">
        <h1 className="text-2xl font-black">Recenzije</h1>
        <p className="text-sm text-muted-foreground">{testimonials.length} recenzija ukupno</p>
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
    </div>
  );
}
