"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ConciergeBell, Upload, X } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Obavezno"),
  description: z.string().optional(),
  price_from: z.coerce.number().optional(),
  price_unit: z.string().default("KM"),
  is_active: z.boolean(),
  sort_order: z.coerce.number(),
});

type FormData = z.infer<typeof schema>;

export default function AdminUsluge() {
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { is_active: true, sort_order: 0, price_unit: "KM" },
  });

  const load = async () => {
    const { data } = await supabase.from("services").select("*").order("sort_order");
    setServices((data ?? []) as Service[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setImageUrl("");
    reset({ is_active: true, sort_order: services.length, price_unit: "KM" });
    setOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setImageUrl(s.image ?? "");
    reset({
      name: s.name,
      description: s.description ?? "",
      price_from: s.price_from ?? undefined,
      price_unit: s.price_unit,
      is_active: s.is_active,
      sort_order: s.sort_order,
    });
    setOpen(true);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `services/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (error) { toast.error("Greška pri uploadu"); setUploading(false); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
    toast.success("Slika uploadovana");
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const payload = {
      ...data,
      image: imageUrl || null,
      description: data.description || null,
      price_from: data.price_from ?? null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = editing
      ? await supabase.from("services").update(payload as any).eq("id", editing.id)
      : await supabase.from("services").insert(payload as any);
    setSaving(false);
    if (error) { toast.error("Greška: " + error.message); return; }
    toast.success(editing ? "Usluga ažurirana" : "Usluga dodana");
    setOpen(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Obrisati uslugu?")) return;
    await supabase.from("services").delete().eq("id", id);
    toast.success("Usluga obrisana");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Usluge</h1>
          <p className="text-sm text-muted-foreground">{services.length} usluga</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Dodaj uslugu</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ConciergeBell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nema usluga. Dodaj prvu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map((s) => (
            <Card key={s.id} className={`border-border ${!s.is_active ? "opacity-50" : ""}`}>
              <CardContent className="p-4 flex items-center gap-4">
                {s.image ? (
                  <img src={s.image} alt={s.name} className="w-16 h-16 object-cover rounded-xl shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                    <ConciergeBell className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{s.name}</p>
                  {s.price_from && (
                    <p className="text-xs text-primary font-bold">od {s.price_from} {s.price_unit}</p>
                  )}
                  {s.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{s.description}</p>
                  )}
                  {!s.is_active && <p className="text-xs text-amber-400/80 mt-0.5">Neaktivna</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-400 hover:text-red-300" onClick={() => del(s.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Uredi uslugu" : "Dodaj uslugu"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1">
              <Label>Naziv *</Label>
              <Input {...register("name")} placeholder="npr. Pranje auta" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Opis</Label>
              <Textarea {...register("description")} placeholder="Šta usluga uključuje..." rows={3} />
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Slika</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
              />
              {imageUrl ? (
                <div className="relative inline-block">
                  <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-border rounded-xl py-5 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">{uploading ? "Uploadovanje..." : "Klikni za upload slike"}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Cijena od (opciono)</Label>
                <Input {...register("price_from")} type="number" step="0.01" placeholder="npr. 15" />
              </div>
              <div className="space-y-1">
                <Label>Valuta</Label>
                <Input {...register("price_unit")} placeholder="KM" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Redoslijed</Label>
                <Input {...register("sort_order")} type="number" />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
              <Controller name="is_active" control={control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} id="active" />
              )} />
              <div>
                <Label htmlFor="active" className="cursor-pointer">Aktivna</Label>
                <p className="text-xs text-muted-foreground">Vidljiva na stranici Usluge</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Čuvanje..." : editing ? "Sačuvaj izmjene" : "Dodaj uslugu"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Odustani</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
