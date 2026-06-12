"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Vehicle } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Plus, Edit, Trash2, Car, Upload, X, ImageIcon, GalleryThumbnails, Search } from "lucide-react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const schema = z.object({
  brand: z.string().min(1, "Obavezno"),
  model: z.string().min(1, "Obavezno"),
  year: z.coerce.number().min(1900).max(2030),
  vin: z.string().optional(),
  mileage: z.coerce.number().min(0),
  fuel_type: z.string().min(1),
  transmission: z.string().min(1),
  price: z.coerce.number().min(0),
  currency: z.string().min(1),
  color: z.string().optional(),
  engine_size: z.string().optional(),
  power: z.string().optional(),
  description: z.string().min(1, "Obavezno"),
  features: z.string(),
  status: z.string().min(1),
  is_featured: z.boolean(),
  is_service_sale: z.boolean(),
  expected_arrival_date: z.string().optional(),
  doors: z.coerce.number().optional(),
  seats: z.coerce.number().optional(),
  body_type: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-500/20 text-green-400 border-green-500/30",
  reserved: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  sold: "bg-red-500/20 text-red-400 border-red-500/30",
  upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Dostupno",
  reserved: "Rezervisano",
  sold: "Prodano",
  upcoming: "Uskoro",
};

function ImageUploader({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("vehicles").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("vehicles").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      onChange([...images, ...uploaded]);
      toast.success(`${uploaded.length} slika učitano`);
    } catch {
      toast.error("Greška pri učitavanju slika");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange([...images, trimmed]);
    setUrlInput("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="URL slike..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
        />
        <Button type="button" variant="outline" size="sm" onClick={addUrl}>Dodaj</Button>
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Učitavanje..." : "Upload slika"}
        </Button>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-secondary group">
              {img.startsWith("http") ? (
                <img src={img} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  Naslovna
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminVehicles() {
  const supabase = createClient();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [onlyService, setOnlyService] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { currency: "EUR", status: "available", is_featured: false, is_service_sale: false, features: "" },
  });

  const loadVehicles = async () => {
    const { data } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });
    setVehicles(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadVehicles(); }, []);

  const openNew = () => {
    setEditing(null);
    setImages([]);
    reset({ currency: "EUR", status: "available", is_featured: false, features: "", mileage: 0, price: 0, year: new Date().getFullYear() });
    setOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setImages(v.images ?? []);
    reset({
      brand: v.brand, model: v.model, year: v.year, vin: v.vin ?? "",
      mileage: v.mileage, fuel_type: v.fuel_type, transmission: v.transmission,
      price: v.price, currency: v.currency, color: v.color ?? "",
      engine_size: v.engine_size ?? "", power: v.power ?? "",
      description: v.description, features: (v.features ?? []).join(", "),
      status: v.status, is_featured: v.is_featured, is_service_sale: v.is_service_sale ?? false,
      expected_arrival_date: v.expected_arrival_date ?? "",
      doors: v.doors ?? undefined, seats: v.seats ?? undefined, body_type: v.body_type ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const payload = {
      ...data,
      vin: data.vin || null,
      color: data.color || null,
      engine_size: data.engine_size || null,
      power: data.power || null,
      expected_arrival_date: data.expected_arrival_date || null,
      body_type: data.body_type || null,
      doors: data.doors || null,
      seats: data.seats || null,
      features: data.features.split(",").map((f) => f.trim()).filter(Boolean),
      images,
      videos: editing?.videos ?? [],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = editing
      ? await supabase.from("vehicles").update(payload as any).eq("id", editing.id)
      : await supabase.from("vehicles").insert(payload as any);

    setSaving(false);
    if (error) { toast.error("Greška pri čuvanju"); return; }
    toast.success(editing ? "Vozilo ažurirano" : "Vozilo dodano");
    setOpen(false);
    loadVehicles();
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm("Obrisati vozilo?")) return;
    await supabase.from("vehicles").delete().eq("id", id);
    toast.success("Vozilo obrisano");
    loadVehicles();
  };

  const filtered = vehicles.filter((v) => {
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (onlyService && !v.is_service_sale) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!`${v.brand} ${v.model}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const STATUS_FILTERS = [
    { key: "all", label: "Sva" },
    { key: "available", label: "Dostupna" },
    { key: "reserved", label: "Rezervisana" },
    { key: "upcoming", label: "Uskoro" },
    { key: "sold", label: "Prodana" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black">Vozila</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length !== vehicles.length
              ? `${filtered.length} / ${vehicles.length} vozila`
              : `${vehicles.length} vozila ukupno`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/portal/instagram-import">
            <Button variant="outline" className="gap-2">
              <GalleryThumbnails className="w-4 h-4" /> Instagram Uvoz
            </Button>
          </Link>
          <Button onClick={openNew} className="gap-2">
            <Plus className="w-4 h-4" /> Dodaj vozilo
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm w-48"
            placeholder="Pretraži vozila..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Service sale toggle */}
        <button
          onClick={() => setOnlyService((v) => !v)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            onlyService
              ? "bg-violet-600 text-white"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Uslužna prodaja
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Car className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{vehicles.length === 0 ? "Nema vozila. Dodajte prvo vozilo." : "Nema vozila koji odgovaraju filteru."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <Card key={v.id} className="border-border overflow-hidden">
              {v.images?.[0] ? (
                <img src={v.images[0]} alt={`${v.brand} ${v.model}`} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-secondary flex items-center justify-center">
                  <Car className="w-10 h-10 text-muted-foreground/30" />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-bold text-sm">{v.brand} {v.model}</p>
                    <p className="text-xs text-muted-foreground">{v.year} · {v.mileage.toLocaleString()} km</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={STATUS_COLORS[v.status]}>{STATUS_LABELS[v.status]}</Badge>
                    {v.is_service_sale && (
                      <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px]">Uslužno</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm font-semibold text-primary mb-3">
                  {v.price.toLocaleString()} {v.currency}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEdit(v)}>
                    <Edit className="w-3 h-3" /> Uredi
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-400 hover:text-red-300" onClick={() => deleteVehicle(v.id)}>
                    <Trash2 className="w-3 h-3" />
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
            <DialogTitle>{editing ? "Uredi vozilo" : "Dodaj vozilo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Marka *</Label>
                <Input {...register("brand")} placeholder="npr. BMW" />
                {errors.brand && <p className="text-xs text-red-500">{errors.brand.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Model *</Label>
                <Input {...register("model")} placeholder="npr. X5" />
                {errors.model && <p className="text-xs text-red-500">{errors.model.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Godina *</Label>
                <Input {...register("year")} type="number" />
              </div>
              <div className="space-y-1">
                <Label>Kilometraža *</Label>
                <Input {...register("mileage")} type="number" />
              </div>
              <div className="space-y-1">
                <Label>VIN</Label>
                <Input {...register("vin")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Gorivo *</Label>
                <Controller name="fuel_type" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Odaberite" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petrol">Benzin</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="electric">Električno</SelectItem>
                      <SelectItem value="hybrid">Hibrid</SelectItem>
                      <SelectItem value="lpg">LPG</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1">
                <Label>Mjenjač *</Label>
                <Controller name="transmission" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Odaberite" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manuelni</SelectItem>
                      <SelectItem value="automatic">Automatski</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Cijena *</Label>
                <Input {...register("price")} type="number" />
              </div>
              <div className="space-y-1">
                <Label>Valuta</Label>
                <Controller name="currency" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="BAM">BAM</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1">
                <Label>Status *</Label>
                <Controller name="status" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Dostupno</SelectItem>
                      <SelectItem value="reserved">Rezervisano</SelectItem>
                      <SelectItem value="sold">Prodano</SelectItem>
                      <SelectItem value="upcoming">Uskoro</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Boja</Label>
                <Input {...register("color")} placeholder="npr. Bijela" />
              </div>
              <div className="space-y-1">
                <Label>Motor</Label>
                <Input {...register("engine_size")} placeholder="npr. 2.0 TDI" />
              </div>
              <div className="space-y-1">
                <Label>Snaga</Label>
                <Input {...register("power")} placeholder="npr. 150 KS" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Vrata</Label>
                <Input {...register("doors")} type="number" />
              </div>
              <div className="space-y-1">
                <Label>Sjedišta</Label>
                <Input {...register("seats")} type="number" />
              </div>
              <div className="space-y-1">
                <Label>Karoserija</Label>
                <Input {...register("body_type")} placeholder="npr. SUV" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Opis *</Label>
              <Textarea {...register("description")} rows={3} />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Oprema (odvojeno zarezom)</Label>
              <Textarea {...register("features")} rows={2} placeholder="Klima, Navigacija, Panorama..." />
            </div>
            <div className="space-y-1">
              <Label>Slike</Label>
              <ImageUploader images={images} onChange={setImages} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Controller name="is_featured" control={control} render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id="featured" />
                )} />
                <Label htmlFor="featured">Istaknuto vozilo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Controller name="is_service_sale" control={control} render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id="service-sale" />
                )} />
                <Label htmlFor="service-sale">Uslužna prodaja</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Čuvanje..." : editing ? "Sačuvaj" : "Dodaj vozilo"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Odustani</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
