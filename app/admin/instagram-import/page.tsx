"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload, GalleryThumbnails, ChevronLeft, ChevronRight, Car, Newspaper,
  Wrench, X, CheckCircle2, AlertCircle, Loader2, FileArchive,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedImage {
  name: string;
  blob: Blob;
  previewUrl: string;
}

interface ParsedPost {
  id: string;
  caption: string;
  timestamp: number;
  images: ParsedImage[];
}

type Destination = "vehicle" | "news" | "operation" | "skip";

interface VehicleForm {
  brand: string;
  model: string;
  year: string;
  mileage: string;
  fuel_type: string;
  transmission: string;
  price: string;
  currency: string;
  description: string;
  status: string;
}

interface ContentForm {
  title: string;
  category: string;
  description: string;
}

interface Entry {
  post: ParsedPost;
  destination: Destination;
  vehicleForm: VehicleForm;
  newsForm: ContentForm;
  operationForm: ContentForm;
  imageIdx: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const KNOWN_BRANDS = [
  "BMW", "Mercedes", "Mercedes-Benz", "Audi", "Volkswagen", "VW", "Toyota", "Ford",
  "Peugeot", "Renault", "Opel", "Skoda", "Seat", "Hyundai", "Kia", "Mazda",
  "Honda", "Nissan", "Volvo", "Range Rover", "Land Rover", "Porsche",
  "Jeep", "Fiat", "Alfa Romeo", "Citroën", "Dacia", "Mitsubishi", "Suzuki",
];

function extractYear(text: string): string {
  const m = text.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  return m ? m[1] : String(new Date().getFullYear());
}

function extractBrand(text: string): string {
  const lower = text.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (lower.includes(brand.toLowerCase())) return brand;
  }
  return "";
}

function extractPrice(text: string): string {
  const m = text.match(/(\d[\d.,]{2,})\s*(?:€|EUR|KM|BAM)/i);
  if (!m) return "";
  return m[1].replace(/[.,]/g, "").replace(/^0+/, "");
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function makeDefaultVehicleForm(caption: string): VehicleForm {
  return {
    brand: extractBrand(caption),
    model: "",
    year: extractYear(caption),
    mileage: "0",
    fuel_type: "petrol",
    transmission: "automatic",
    price: extractPrice(caption),
    currency: "EUR",
    description: caption.slice(0, 1000),
    status: "available",
  };
}

function makeDefaultContentForm(caption: string): ContentForm {
  return {
    title: caption.slice(0, 100).split("\n")[0] || "Bez naslova",
    category: "announcement",
    description: caption.slice(0, 500),
  };
}

// ─── ZIP Parsing ──────────────────────────────────────────────────────────────

async function parseGalleryThumbnailsZip(file: File): Promise<ParsedPost[]> {
  const zip = await JSZip.loadAsync(file);

  // Locate posts JSON (GalleryThumbnails uses posts_1.json or posts.json)
  const candidates = ["posts_1.json", "posts.json"];
  let jsonFile: JSZip.JSZipObject | null = null;
  let rootPrefix = "";

  for (const zipFile of Object.values(zip.files)) {
    if (zipFile.dir) continue;
    const basename = zipFile.name.split("/").pop() ?? "";
    if (candidates.includes(basename)) {
      jsonFile = zipFile;
      const parts = zipFile.name.split("/");
      rootPrefix = parts.length > 1 ? parts.slice(0, -1).join("/") + "/" : "";
      break;
    }
  }

  if (!jsonFile) {
    throw new Error(
      "Nije pronađen posts.json ili posts_1.json u ZIP fajlu. Provjerite da ste preuzeli GalleryThumbnails podatke u JSON formatu."
    );
  }

  const rawText = await jsonFile.async("text");
  const rawData = JSON.parse(rawText) as unknown;

  if (!Array.isArray(rawData)) {
    throw new Error("Neočekivani format GalleryThumbnails podataka.");
  }

  const posts: ParsedPost[] = [];

  for (const item of rawData as Record<string, unknown>[]) {
    const mediaArr = item.media as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(mediaArr) || !mediaArr.length) continue;

    const firstMedia = mediaArr[0];
    const caption = String(firstMedia.title ?? "");
    const timestamp = Number(firstMedia.creation_timestamp ?? Date.now() / 1000);

    const images: ParsedImage[] = [];

    for (const m of mediaArr) {
      const uri = String(m.uri ?? "");
      if (!uri || !/\.(jpg|jpeg|png|webp|gif)$/i.test(uri)) continue;

      // Try prefixed path first, then direct
      const fullPath = rootPrefix + uri;
      const entry = zip.file(fullPath) ?? zip.file(uri);
      if (!entry) continue;

      const blob = await entry.async("blob");
      const previewUrl = URL.createObjectURL(blob);
      images.push({ name: uri.split("/").pop() ?? "image.jpg", blob, previewUrl });
    }

    if (images.length === 0) continue;

    posts.push({
      id: `${timestamp}-${Math.random().toString(36).slice(2)}`,
      caption,
      timestamp,
      images,
    });
  }

  return posts;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniCarousel({ images, idx, onIdx }: { images: ParsedImage[]; idx: number; onIdx: (i: number) => void }) {
  const touchStart = useRef<number | null>(null);

  if (!images.length) return null;

  const prev = () => onIdx(idx === 0 ? images.length - 1 : idx - 1);
  const next = () => onIdx(idx === images.length - 1 ? 0 : idx + 1);

  return (
    <div className="relative rounded-xl overflow-hidden bg-secondary aspect-video group">
      <img src={images[idx].previewUrl} alt="" className="w-full h-full object-cover select-none" draggable={false}
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStart.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
          touchStart.current = null;
        }}
      />
      {images.length > 1 && (
        <>
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {idx + 1}/{images.length}
          </div>
          <button onClick={prev}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

function VehicleFields({ form, onChange }: { form: VehicleForm; onChange: (f: Partial<VehicleForm>) => void }) {
  return (
    <div className="space-y-2 pt-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Marka *</Label>
          <Input className="h-8 text-xs" value={form.brand} onChange={(e) => onChange({ brand: e.target.value })} placeholder="BMW" />
        </div>
        <div>
          <Label className="text-xs">Model *</Label>
          <Input className="h-8 text-xs" value={form.model} onChange={(e) => onChange({ model: e.target.value })} placeholder="X5" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Godište</Label>
          <Input className="h-8 text-xs" type="number" value={form.year} onChange={(e) => onChange({ year: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Kilometraža</Label>
          <Input className="h-8 text-xs" type="number" value={form.mileage} onChange={(e) => onChange({ mileage: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Cijena</Label>
          <Input className="h-8 text-xs" type="number" value={form.price} onChange={(e) => onChange({ price: e.target.value })} placeholder="0" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Gorivo</Label>
          <Select value={form.fuel_type} onValueChange={(v) => onChange({ fuel_type: v ?? form.fuel_type })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="petrol">Benzin</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="electric">Električno</SelectItem>
              <SelectItem value="hybrid">Hibrid</SelectItem>
              <SelectItem value="lpg">LPG</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Mjenjač</Label>
          <Select value={form.transmission} onValueChange={(v) => onChange({ transmission: v ?? form.transmission })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="automatic">Automatski</SelectItem>
              <SelectItem value="manual">Manuelni</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={(v) => onChange({ status: v ?? form.status })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Dostupno</SelectItem>
              <SelectItem value="upcoming">Uskoro</SelectItem>
              <SelectItem value="reserved">Rezervisano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs">Valuta</Label>
        <Select value={form.currency} onValueChange={(v) => onChange({ currency: v ?? form.currency })}>
          <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="BAM">BAM</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Opis</Label>
        <Textarea className="text-xs resize-none" rows={3} value={form.description} onChange={(e) => onChange({ description: e.target.value })} />
      </div>
    </div>
  );
}

function ContentFields({ form, onChange, newsCategories }: {
  form: ContentForm;
  onChange: (f: Partial<ContentForm>) => void;
  newsCategories: Record<string, string>;
}) {
  return (
    <div className="space-y-2 pt-2">
      <div>
        <Label className="text-xs">Naslov *</Label>
        <Input className="h-8 text-xs" value={form.title} onChange={(e) => onChange({ title: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Kategorija</Label>
        <Select value={form.category} onValueChange={(v) => onChange({ category: v ?? form.category })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(newsCategories).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Opis / Excerpt</Label>
        <Textarea className="text-xs resize-none" rows={2} value={form.description} onChange={(e) => onChange({ description: e.target.value })} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const NEWS_CATEGORIES: Record<string, string> = {
  new_arrival: "Novo vozilo", upcoming: "Uskoro", announcement: "Obavijest",
  promotion: "Promocija", industry: "Industrija", spotlight: "Spotlight",
};

const OP_CATEGORIES: Record<string, string> = {
  sourcing: "Nabava", import: "Uvoz", transport: "Transport",
  auction: "Aukcija", inspection: "Inspekcija", detailing: "Detailing",
  preparation: "Priprema", delivery: "Isporuka",
};

type Phase = "upload" | "review" | "importing" | "done";

interface ImportResult {
  id: string;
  label: string;
  ok: boolean;
  error?: string;
}

export default function GalleryThumbnailsImportPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [parsing, setParsing] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      for (const e of entries) {
        for (const img of e.post.images) URL.revokeObjectURL(img.previewUrl);
      }
    };
  }, [entries]);

  const handleZip = useCallback(async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      toast.error("Odaberite ZIP fajl");
      return;
    }
    setParsing(true);
    try {
      const posts = await parseGalleryThumbnailsZip(file);
      if (!posts.length) {
        toast.error("Nisu pronađeni postovi sa slikama u ZIP fajlu");
        setParsing(false);
        return;
      }
      const initialEntries: Entry[] = posts.map((post) => ({
        post,
        destination: "vehicle",
        vehicleForm: makeDefaultVehicleForm(post.caption),
        newsForm: makeDefaultContentForm(post.caption),
        operationForm: makeDefaultContentForm(post.caption),
        imageIdx: 0,
      }));
      setEntries(initialEntries);
      setPhase("review");
      toast.success(`${posts.length} postova pronađeno`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška pri parsiranju ZIP fajla");
    } finally {
      setParsing(false);
    }
  }, []);

  const updateEntry = (id: string, update: Partial<Entry>) => {
    setEntries((prev) => prev.map((e) => (e.post.id === id ? { ...e, ...update } : e)));
  };

  const updateVehicle = (id: string, f: Partial<VehicleForm>) => {
    setEntries((prev) =>
      prev.map((e) => (e.post.id === id ? { ...e, vehicleForm: { ...e.vehicleForm, ...f } } : e))
    );
  };

  const updateNews = (id: string, f: Partial<ContentForm>) => {
    setEntries((prev) =>
      prev.map((e) => (e.post.id === id ? { ...e, newsForm: { ...e.newsForm, ...f } } : e))
    );
  };

  const updateOperation = (id: string, f: Partial<ContentForm>) => {
    setEntries((prev) =>
      prev.map((e) => (e.post.id === id ? { ...e, operationForm: { ...e.operationForm, ...f } } : e))
    );
  };

  const toImport = entries.filter((e) => e.destination !== "skip");

  async function uploadImages(images: ParsedImage[], bucket: string, prefix: string): Promise<string[]> {
    const urls: string[] = [];
    for (const img of images) {
      const ext = img.name.split(".").pop() ?? "jpg";
      const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, img.blob, { upsert: true });
      if (error) throw new Error(`Upload failed: ${error.message}`);
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  const runImport = async () => {
    setPhase("importing");
    setProgress(0);
    const importResults: ImportResult[] = [];

    for (let i = 0; i < toImport.length; i++) {
      const entry = toImport[i];
      setProgress(Math.round(((i) / toImport.length) * 100));

      try {
        if (entry.destination === "vehicle") {
          const vf = entry.vehicleForm;
          if (!vf.brand.trim() || !vf.model.trim()) {
            importResults.push({ id: entry.post.id, label: "Vozilo (bez naziva)", ok: false, error: "Marka i model su obavezni" });
            continue;
          }
          const imageUrls = await uploadImages(entry.post.images, "vehicles", "instagram");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase.from("vehicles") as any).insert({
            brand: vf.brand.trim(),
            model: vf.model.trim(),
            year: Number(vf.year) || new Date().getFullYear(),
            mileage: Number(vf.mileage) || 0,
            fuel_type: vf.fuel_type,
            transmission: vf.transmission,
            price: Number(vf.price) || 0,
            currency: vf.currency,
            description: vf.description.trim() || entry.post.caption,
            status: vf.status,
            images: imageUrls,
            videos: [],
            features: [],
            is_featured: false,
          });
          if (error) throw new Error(error.message);
          importResults.push({ id: entry.post.id, label: `${vf.brand} ${vf.model}`, ok: true });

        } else if (entry.destination === "news") {
          const nf = entry.newsForm;
          if (!nf.title.trim()) {
            importResults.push({ id: entry.post.id, label: "Vijest (bez naslova)", ok: false, error: "Naslov je obavezan" });
            continue;
          }
          const imageUrls = await uploadImages(entry.post.images, "media", "news");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase.from("news") as any).insert({
            title: nf.title.trim(),
            slug: slugify(nf.title.trim()) + "-" + Date.now(),
            excerpt: nf.description.trim().slice(0, 300) || nf.title.trim(),
            content: nf.description.trim(),
            featured_image: imageUrls[0] ?? null,
            gallery: imageUrls.slice(1),
            category: nf.category,
            is_published: false,
            published_at: null,
          });
          if (error) throw new Error(error.message);
          importResults.push({ id: entry.post.id, label: nf.title.trim(), ok: true });

        } else if (entry.destination === "operation") {
          const of_ = entry.operationForm;
          if (!of_.title.trim()) {
            importResults.push({ id: entry.post.id, label: "Operacija (bez naslova)", ok: false, error: "Naslov je obavezan" });
            continue;
          }
          const imageUrls = await uploadImages(entry.post.images, "media", "operations");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase.from("operations") as any).insert({
            title: of_.title.trim(),
            slug: slugify(of_.title.trim()) + "-" + Date.now(),
            description: of_.description.trim(),
            content: of_.description.trim(),
            images: imageUrls,
            videos: [],
            category: of_.category,
            is_published: false,
            published_at: null,
          });
          if (error) throw new Error(error.message);
          importResults.push({ id: entry.post.id, label: of_.title.trim(), ok: true });
        }
      } catch (err) {
        const label =
          entry.destination === "vehicle"
            ? `${entry.vehicleForm.brand} ${entry.vehicleForm.model}`.trim() || "Vozilo"
            : entry.destination === "news"
            ? entry.newsForm.title || "Vijest"
            : entry.operationForm.title || "Operacija";
        importResults.push({ id: entry.post.id, label, ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    setProgress(100);
    setResults(importResults);
    setPhase("done");
  };

  // ── Upload Phase ─────────────────────────────────────────────────────────────
  if (phase === "upload") {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <GalleryThumbnails className="w-6 h-6" /> GalleryThumbnails Uvoz
          </h1>
          <p className="text-sm text-muted-foreground">Uvezite postove iz GalleryThumbnails izvoza i kreirajte vozila, vijesti ili operacije</p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleZip(file);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleZip(f); }}
          />
          {parsing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-sm font-medium">Parsiranje ZIP fajla...</p>
              <p className="text-xs text-muted-foreground">Ovo može potrajati za veće arhive</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <FileArchive className="w-12 h-12 text-muted-foreground/40" />
              <div>
                <p className="font-semibold text-foreground">Prevucite ZIP fajl ovdje</p>
                <p className="text-sm text-muted-foreground">ili kliknite za odabir fajla</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 pointer-events-none">
                <Upload className="w-4 h-4" /> Odaberi ZIP
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8 bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-sm mb-3">Kako preuzeti GalleryThumbnails podatke?</h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Otvorite GalleryThumbnails aplikaciju na telefonu</li>
            <li>Idite na <strong className="text-foreground">Profil → Hamburger meni → Postavke i aktivnost</strong></li>
            <li>Odaberite <strong className="text-foreground">Vaše aktivnosti → Preuzmite vaše informacije</strong></li>
            <li>Odaberite profil i kliknite <strong className="text-foreground">Preuzmi ili prenesi informacije</strong></li>
            <li>Odaberite <strong className="text-foreground">Postovi → Format: JSON</strong></li>
            <li>Kliknite <strong className="text-foreground">Kreirajte fajlove</strong> i sačekajte email</li>
            <li>Preuzmite ZIP i uvezite ga ovdje</li>
          </ol>
          <p className="mt-3 text-xs text-muted-foreground/70">
            ZIP fajl se procesira lokalno u vašem browseru — nijedan fajl se ne šalje na naše servere osim slika koje odaberete za uvoz.
          </p>
        </div>
      </div>
    );
  }

  // ── Done Phase ───────────────────────────────────────────────────────────────
  if (phase === "done") {
    const successes = results.filter((r) => r.ok);
    const failures = results.filter((r) => !r.ok);
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-400" /> Uvoz završen
          </h1>
          <p className="text-sm text-muted-foreground">
            {successes.length} uspješno uvezeno, {failures.length} grešaka
          </p>
        </div>
        <div className="space-y-2 mb-6">
          {results.map((r) => (
            <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border ${r.ok ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
              {r.ok
                ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.label}</p>
                {r.error && <p className="text-xs text-red-400">{r.error}</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { setPhase("upload"); setEntries([]); setResults([]); }}>
            Novi uvoz
          </Button>
          <Button variant="outline" onClick={() => setPhase("review")}>
            Nazad na pregled
          </Button>
        </div>
      </div>
    );
  }

  // ── Importing Phase ───────────────────────────────────────────────────────────
  if (phase === "importing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div className="text-center">
          <p className="font-semibold">Uvoz u toku...</p>
          <p className="text-sm text-muted-foreground">{progress}% završeno</p>
        </div>
        <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  // ── Review Phase ─────────────────────────────────────────────────────────────
  const destLabel: Record<Destination, string> = {
    vehicle: "Vozilo", news: "Vijest", operation: "Operacija", skip: "Preskoči",
  };
  const destIcon: Record<Destination, React.ReactNode> = {
    vehicle: <Car className="w-3.5 h-3.5" />,
    news: <Newspaper className="w-3.5 h-3.5" />,
    operation: <Wrench className="w-3.5 h-3.5" />,
    skip: <X className="w-3.5 h-3.5" />,
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <GalleryThumbnails className="w-6 h-6" /> Pregled postova
          </h1>
          <p className="text-sm text-muted-foreground">
            {entries.length} postova · {toImport.length} odabrano za uvoz
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => { setPhase("upload"); setEntries([]); }}>
            Novi fajl
          </Button>
          <Button size="sm" onClick={runImport} disabled={toImport.length === 0} className="gap-2">
            <Upload className="w-4 h-4" /> Importuj {toImport.length > 0 ? `(${toImport.length})` : ""}
          </Button>
        </div>
      </div>

      {/* Select all / skip all helpers */}
      <div className="flex gap-2 mb-4">
        {(["vehicle", "news", "operation", "skip"] as Destination[]).map((d) => (
          <button
            key={d}
            onClick={() => setEntries((prev) => prev.map((e) => ({ ...e, destination: d })))}
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors flex items-center gap-1.5"
          >
            {destIcon[d]} Sve → {destLabel[d]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {entries.map((entry) => (
          <div
            key={entry.post.id}
            className={`rounded-2xl border overflow-hidden transition-colors ${
              entry.destination === "skip" ? "border-border opacity-50" : "border-border"
            }`}
          >
            {/* Image preview */}
            <MiniCarousel
              images={entry.post.images}
              idx={entry.imageIdx}
              onIdx={(i) => updateEntry(entry.post.id, { imageIdx: i })}
            />

            <div className="p-3 space-y-3">
              {/* Caption */}
              {entry.post.caption && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {entry.post.caption}
                </p>
              )}

              {/* Date & image count */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/60">
                  {new Date(entry.post.timestamp * 1000).toLocaleDateString("bs-BA")}
                </span>
                {entry.post.images.length > 1 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                    {entry.post.images.length} slika
                  </Badge>
                )}
              </div>

              {/* Destination selector */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Odredište</Label>
                <div className="grid grid-cols-4 gap-1">
                  {(["vehicle", "news", "operation", "skip"] as Destination[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => updateEntry(entry.post.id, { destination: d })}
                      className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg border text-xs font-medium transition-colors ${
                        entry.destination === d
                          ? d === "skip"
                            ? "border-red-500/50 bg-red-500/10 text-red-400"
                            : "border-primary/50 bg-primary/10 text-primary"
                          : "border-border hover:bg-secondary text-muted-foreground"
                      }`}
                    >
                      {destIcon[d]}
                      <span className="text-[10px] leading-none">{destLabel[d]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Per-destination form */}
              {entry.destination === "vehicle" && (
                <VehicleFields form={entry.vehicleForm} onChange={(f) => updateVehicle(entry.post.id, f)} />
              )}
              {entry.destination === "news" && (
                <ContentFields form={entry.newsForm} onChange={(f) => updateNews(entry.post.id, f)} newsCategories={NEWS_CATEGORIES} />
              )}
              {entry.destination === "operation" && (
                <ContentFields form={entry.operationForm} onChange={(f) => updateOperation(entry.post.id, f)} newsCategories={OP_CATEGORIES} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky bottom import bar */}
      <div className="sticky bottom-4 mt-6 flex justify-center">
        <div className="bg-card border border-border rounded-2xl shadow-lg px-6 py-3 flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {toImport.length} od {entries.length} odabrano
          </span>
          <Button onClick={runImport} disabled={toImport.length === 0} className="gap-2">
            <Upload className="w-4 h-4" />
            Importuj {toImport.length > 0 ? `(${toImport.length})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
