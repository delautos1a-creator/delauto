"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Operation } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Wrench, Upload, X, ImageIcon } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1, "Obavezno"),
  slug: z.string().min(1, "Obavezno"),
  description: z.string().min(1, "Obavezno"),
  content: z.string(),
  category: z.string().min(1),
  is_published: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const CATEGORY_LABELS: Record<string, string> = {
  sourcing: "Nabava", import: "Uvoz", transport: "Transport",
  auction: "Aukcija", inspection: "Inspekcija", detailing: "Detailing",
  preparation: "Priprema", delivery: "Isporuka",
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminOperations() {
  const supabase = createClient();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Operation | null>(null);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "sourcing", is_published: false, content: "", title: "", slug: "", description: "" },
  });

  const slug = watch("slug");

  const load = async () => {
    const { data } = await supabase.from("operations").select("*").order("created_at", { ascending: false });
    setOperations((data ?? []) as Operation[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setImages([]);
    reset({ category: "sourcing", is_published: false, content: "", title: "", slug: "", description: "" });
    setOpen(true);
  };

  const openEdit = (op: Operation) => {
    setEditing(op);
    setImages((op as any).images ?? []);
    reset({
      title: op.title,
      slug: op.slug,
      description: op.description ?? "",
      content: (op as any).content ?? "",
      category: (op as any).category ?? "sourcing",
      is_published: op.is_published,
    });
    setOpen(true);
  };

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `operations/${slug || "new"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
      if (error) { toast.error(`Greška: ${file.name}`); continue; }
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setImages(prev => [...prev, ...urls]);
    setUploading(false);
    if (urls.length) toast.success(`${urls.length} slika uploadovano`);
  };

  const removeImage = (url: string) => setImages(prev => prev.filter(i => i !== url));

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      ...data,
      images,
      published_at: data.is_published ? new Date().toISOString() : null,
    };
    const { error } = editing
      ? await supabase.from("operations").update(payload).eq("id", editing.id)
      : await supabase.from("operations").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Operacija ažurirana" : "Operacija dodana");
    setOpen(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Obrisati operaciju?")) return;
    await supabase.from("operations").delete().eq("id", id);
    toast.success("Operacija obrisana");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Operacije</h1>
          <p className="text-sm text-muted-foreground">{operations.length} operacija</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Nova operacija</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : operations.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nema operacija. Dodaj prvu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {operations.map((op) => (
            <Card key={op.id} className="border-border">
              <CardContent className="p-4 flex items-center gap-4">
                {(op as any).images?.[0] ? (
                  <img src={(op as any).images[0]} alt={op.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm truncate">{op.title}</p>
                    {op.is_published
                      ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 shrink-0">Objavljeno</Badge>
                      : <Badge variant="outline" className="text-amber-400 border-amber-400/30 shrink-0">Nacrt</Badge>
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[(op as any).category ?? ""] ?? (op as any).category}</p>
                  <p className="text-xs text-muted-foreground truncate">{op.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(op)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-400 hover:text-red-300" onClick={() => del(op.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Uredi operaciju" : "Nova operacija"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label>Naziv *</Label>
                <Input
                  {...register("title")}
                  placeholder="npr. Uvoz vozila iz Francuske"
                  onChange={(e) => {
                    register("title").onChange(e);
                    if (!editing) setValue("slug", slugify(e.target.value));
                  }}
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Slug (URL)</Label>
                <Input {...register("slug")} placeholder="uvoz-vozila" />
              </div>
              <div className="space-y-1">
                <Label>Kategorija</Label>
                <Controller name="category" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Kratki opis *</Label>
              <Input {...register("description")} placeholder="Sažetak koji se prikazuje na kartici operacije" />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Slike</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && uploadImages(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm font-medium">{uploading ? "Uploadovanje..." : "Klikni za dodavanje slika"}</span>
                <span className="text-xs opacity-60">JPG, PNG, WebP — možeš odabrati više odjednom</span>
              </button>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((url, i) => (
                    <div key={url} className="relative group rounded-lg overflow-hidden aspect-video bg-secondary">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                          Naslovna
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label>Sadržaj (tekst ili HTML)</Label>
              <p className="text-xs text-muted-foreground">Piši normalan tekst — svaki novi red će biti novi odlomak. Za naprednije formatiranje možeš koristiti HTML tagove.</p>
              <textarea
                {...register("content")}
                rows={10}
                className="w-full text-sm bg-secondary border border-border rounded-md px-3 py-2 resize-y text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ovdje upiši detaljan opis operacije...

Svaki prazan red postaje novi odlomak na sajtu."
              />
            </div>

            <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
              <Controller name="is_published" control={control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} id="published" />
              )} />
              <div>
                <Label htmlFor="published" className="cursor-pointer">Objavljeno</Label>
                <p className="text-xs text-muted-foreground">Vidljivo na sajtu pod /operacije</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Čuvanje..." : editing ? "Sačuvaj izmjene" : "Dodaj operaciju"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Odustani</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
