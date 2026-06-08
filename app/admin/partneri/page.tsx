"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Partner } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Handshake, Upload, X } from "lucide-react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Obavezno"),
  website: z.string().optional(),
  category: z.string().min(1),
  is_active: z.boolean(),
  sort_order: z.coerce.number(),
});

type FormData = z.infer<typeof schema>;

const CATEGORY_LABELS: Record<string, string> = {
  bank: "Banka", leasing: "Leasing", insurance: "Osiguranje",
  logistics: "Logistika", corporate: "Korporativno", other: "Ostalo",
};

export default function AdminPartners() {
  const supabase = createClient();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { category: "other", is_active: true, sort_order: 0 },
  });

  const load = async () => {
    const { data } = await supabase.from("partners").select("*").order("sort_order");
    setPartners(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setLogoUrl("");
    reset({ category: "other", is_active: true, sort_order: partners.length });
    setOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setLogoUrl(p.logo ?? "");
    reset({ name: p.name, website: p.website ?? "", category: p.category, is_active: p.is_active, sort_order: p.sort_order });
    setOpen(true);
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `partners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (error) { toast.error("Greška pri uploadu"); setUploading(false); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Logo uploadovan");
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const payload = {
      ...data,
      logo: logoUrl || null,
      website: data.website || null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = editing
      ? await supabase.from("partners").update(payload as any).eq("id", editing.id)
      : await supabase.from("partners").insert(payload as any);
    setSaving(false);
    if (error) { toast.error("Greška"); return; }
    toast.success(editing ? "Partner ažuriran" : "Partner dodan");
    setOpen(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Obrisati partnera?")) return;
    await supabase.from("partners").delete().eq("id", id);
    toast.success("Partner obrisan");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Partneri</h1>
          <p className="text-sm text-muted-foreground">{partners.length} partnera</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Dodaj partnera</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Handshake className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nema partnera. Dodaj prvog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {partners.map((p) => (
            <Card key={p.id} className={`border-border ${!p.is_active ? "opacity-50" : ""}`}>
              <CardContent className="p-4 flex items-center gap-4">
                {p.logo ? (
                  <img src={p.logo} alt={p.name} className="w-16 h-10 object-contain rounded" />
                ) : (
                  <div className="w-16 h-10 bg-secondary rounded flex items-center justify-center shrink-0">
                    <Handshake className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[p.category] ?? p.category}</p>
                  {!p.is_active && <p className="text-xs text-amber-400/80">Neaktivan</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-400 hover:text-red-300" onClick={() => del(p.id)}>
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
            <DialogTitle>{editing ? "Uredi partnera" : "Dodaj partnera"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1">
              <Label>Naziv *</Label>
              <Input {...register("name")} placeholder="npr. UniCredit Bank" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Logo upload */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
              />
              {logoUrl ? (
                <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
                  <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain max-w-[120px]" />
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="ml-auto text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
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
                  <span className="text-sm">{uploading ? "Uploadovanje..." : "Klikni za upload loga"}</span>
                  <span className="text-xs opacity-60">PNG, SVG, WebP — preporučeno transparentna pozadina</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              <Label>Web stranica</Label>
              <Input {...register("website")} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <Label htmlFor="active" className="cursor-pointer">Aktivan</Label>
                <p className="text-xs text-muted-foreground">Vidljiv u ribbonu na sajtu</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Čuvanje..." : editing ? "Sačuvaj izmjene" : "Dodaj partnera"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Odustani</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
