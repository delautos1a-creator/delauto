"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NewsArticle } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Newspaper } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1, "Obavezno"),
  slug: z.string().min(1, "Obavezno"),
  excerpt: z.string().min(1, "Obavezno"),
  content: z.string(),
  featured_image: z.string().optional(),
  category: z.string().min(1),
  is_published: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const CATEGORY_LABELS: Record<string, string> = {
  new_arrival: "Novo vozilo", upcoming: "Uskoro", announcement: "Obavijest",
  promotion: "Promocija", industry: "Industrija", spotlight: "Spotlight",
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminNews() {
  const supabase = createClient();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "announcement", is_published: false },
  });

  const titleValue = watch("title");

  const load = async () => {
    const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    setNews(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    reset({ category: "announcement", is_published: false });
    setOpen(true);
  };

  const openEdit = (n: NewsArticle) => {
    setEditing(n);
    reset({ title: n.title, slug: n.slug, excerpt: n.excerpt, content: n.content, featured_image: n.featured_image ?? "", category: n.category, is_published: n.is_published });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const payload = { ...data, featured_image: data.featured_image || null, gallery: editing?.gallery ?? [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = editing
      ? await supabase.from("news").update(payload as any).eq("id", editing.id)
      : await supabase.from("news").insert(payload as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Vijest ažurirana" : "Vijest dodana");
    setOpen(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Obrisati vijest?")) return;
    await supabase.from("news").delete().eq("id", id);
    toast.success("Vijest obrisana");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Vijesti</h1>
          <p className="text-sm text-muted-foreground">{news.length} vijesti</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Nova vijest</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : news.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nema vijesti.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((n) => (
            <Card key={n.id} className="border-border">
              <CardContent className="p-4 flex items-center gap-4">
                {n.featured_image && (
                  <img src={n.featured_image} alt={n.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm truncate">{n.title}</p>
                    {n.is_published
                      ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 shrink-0">Objavljeno</Badge>
                      : <Badge variant="outline" className="shrink-0">Nacrt</Badge>
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[n.category] ?? n.category}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.excerpt}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(n)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-400" onClick={() => del(n.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Uredi vijest" : "Nova vijest"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Naslov *</Label>
              <Input
                {...register("title")}
                onChange={(e) => {
                  register("title").onChange(e);
                  if (!editing) setValue("slug", slugify(e.target.value));
                }}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Slug *</Label>
              <Input {...register("slug")} />
              {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Kratki opis *</Label>
              <Input {...register("excerpt")} />
              {errors.excerpt && <p className="text-xs text-red-500">{errors.excerpt.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Sadržaj (HTML)</Label>
              <textarea {...register("content")} rows={6} className="w-full text-sm bg-secondary border border-border rounded-md px-3 py-2 font-mono resize-y" placeholder="<p>Tekst vijesti...</p>" />
            </div>
            <div className="space-y-1">
              <Label>Naslovna slika URL</Label>
              <Input {...register("featured_image")} placeholder="https://..." />
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
            <div className="flex items-center gap-2">
              <Controller name="is_published" control={control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} id="published" />
              )} />
              <Label htmlFor="published">Objavi odmah</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Čuvanje..." : editing ? "Sačuvaj" : "Dodaj"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Odustani</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
