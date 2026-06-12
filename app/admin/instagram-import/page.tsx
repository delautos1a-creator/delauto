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
  color: string;
  engine_size: string;
  power: string;
  doors: string;
  seats: string;
  features: string;
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

// ─── Encoding fix ─────────────────────────────────────────────────────────────
// Instagram exports text as Latin-1 encoded UTF-8 bytes — fix the mojibake.

function fixEncoding(str: string): string {
  if (!str) return "";
  try {
    return decodeURIComponent(escape(str));
  } catch {
    return str;
  }
}

// ─── Account root detection ───────────────────────────────────────────────────

function findAccountRoot(zip: JSZip): string {
  for (const path of Object.keys(zip.files)) {
    const parts = path.split("/");
    if (parts.length >= 2 && parts[0] && !parts[0].startsWith(".")) {
      return parts[0] + "/";
    }
  }
  return "";
}

// ─── Caption → vehicle fields ─────────────────────────────────────────────────

const KNOWN_BRANDS = [
  "BMW", "Mercedes-Benz", "Mercedes", "Audi", "Volkswagen", "VW", "Toyota",
  "Ford", "Peugeot", "Renault", "Opel", "Skoda", "Seat", "Hyundai", "Kia",
  "Mazda", "Honda", "Nissan", "Volvo", "Range Rover", "Land Rover", "Porsche",
  "Jeep", "Fiat", "Alfa Romeo", "Citroën", "Citroen", "Dacia", "Mitsubishi",
  "Suzuki", "Subaru", "Lexus", "Infiniti", "Jaguar", "Bentley", "Aston Martin",
  "Maserati", "Lamborghini", "Ferrari",
];

function stripLeadingNonAlpha(s: string): string {
  // Remove leading emojis, bullets, and symbols without using \p{} which can throw
  // Strips anything before the first letter (A-Z, a-z, accented Latin, Cyrillic, etc.)
  return s.replace(/^[^A-Za-zÀ-ɏЀ-ӿ\d]+/, "").trim();
}

function extractBrandModel(titleLine: string): { brand: string; model: string } {
  try {
    const clean = stripLeadingNonAlpha(titleLine);

    for (const brand of KNOWN_BRANDS) {
      const escaped = brand.replace(/-/g, "\\-").replace(/\./g, "\\.");
      let re: RegExp;
      try {
        re = new RegExp(`\\b${escaped}\\b`, "i");
      } catch {
        continue;
      }
      const m = re.exec(clean);
      if (!m) continue;

      const afterBrand = clean.slice(m.index + m[0].length).trim();
      const words = afterBrand.split(/\s+/);
      const modelWords: string[] = [];
      for (const w of words) {
        if (/^\d/.test(w) || w === "–" || w === "-") break;
        if (/[a-zA-ZÀ-ɏ]/.test(w)) {
          modelWords.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        }
      }

      const brandFmt = brand
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join("-");

      return { brand: brandFmt, model: modelWords.join(" ") };
    }
  } catch {
    // ignore — return empty
  }
  return { brand: "", model: "" };
}

interface ParsedVehicle {
  brand?: string;
  model?: string;
  year?: string;
  mileage?: string;
  fuel_type?: string;
  transmission?: string;
  price?: string;
  currency?: string;
  color?: string;
  engine_size?: string;
  power?: string;
  doors?: string;
  seats?: string;
  features?: string;
}

function parseVehicleFromCaption(caption: string): ParsedVehicle {
  try {
  if (!caption.trim()) return {};

  const lines = caption.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: ParsedVehicle = {};

  // First non-empty line = title
  if (lines[0]) {
    const { brand, model } = extractBrandModel(lines[0]);
    if (brand) result.brand = brand;
    if (model) result.model = model;
  }

  const features: string[] = [];
  let inFeatures = false;

  for (const raw of lines.slice(1)) {
    // Strip leading emoji / bullet chars (avoid \p{} which can throw in some runtimes)
    const line = stripLeadingNonAlpha(raw.replace(/^[\s•·\-–🔧🔹🛠📞💡]+/, ""));

    // Features section start
    if (/^oprema/i.test(line)) {
      inFeatures = true;
      continue;
    }

    // Features section end triggers
    if (inFeatures) {
      const isSection = /^(servisna|stanje|cijena|kontakt|napomena|dodatne|uvoz|garancija|pogon|Info)/i.test(line)
        || /^\+?[\d\s()-]{8,}$/.test(line);
      if (isSection && line.includes(":")) {
        inFeatures = false;
      } else if (!line.includes(":") && line.length > 1 && line.length < 100) {
        features.push(line);
        continue;
      } else if (isSection) {
        inFeatures = false;
      }
    }

    // key: value parsing
    const ci = line.indexOf(":");
    if (ci === -1) continue;
    const key = line.slice(0, ci).trim().toLowerCase();
    const val = line.slice(ci + 1).trim();
    if (!val) continue;

    if (/godište|godiste|godina/.test(key)) {
      const m = val.match(/\d{4}/);
      if (m) result.year = m[0];
    } else if (/kilometraža|kilometraza/.test(key)) {
      const m = val.match(/[\d.,]+/);
      if (m) result.mileage = m[0].replace(/\./g, "").replace(/,/g, "");
    } else if (/^gorivo$/.test(key)) {
      if (/dizel/i.test(val)) result.fuel_type = "diesel";
      else if (/benzin/i.test(val)) result.fuel_type = "petrol";
      else if (/elektr/i.test(val)) result.fuel_type = "electric";
      else if (/hibrid/i.test(val)) result.fuel_type = "hybrid";
      else if (/lpg|plin/i.test(val)) result.fuel_type = "lpg";
    } else if (/mjenjač|mjenjac|menjač|menjac/.test(key)) {
      if (/automat/i.test(val)) result.transmission = "automatic";
      else if (/manuel/i.test(val)) result.transmission = "manual";
    } else if (/^boja$/.test(key)) {
      result.color = val;
    } else if (/vrata/.test(key)) {
      const m = val.match(/\d/);
      if (m) result.doors = m[0];
    } else if (/sjedišt|sjediš/.test(key)) {
      const m = val.match(/\d/);
      if (m) result.seats = m[0];
    } else if (/^motor$/.test(key)) {
      // "1.5 Blue dCi – 85 kW / 115 KS" → engine = "1.5 Blue dCi"
      result.engine_size = val.split(/[–\-]/)[0].trim();
    } else if (/^snaga$/.test(key)) {
      result.power = val;
    } else if (/cijena/.test(key)) {
      const m = val.match(/([\d.,\s]+)\s*(KM|BAM|EUR|€)/i);
      if (m) {
        result.price = m[1].replace(/[.,\s]/g, "");
        const c = m[2].toUpperCase();
        result.currency = c === "KM" ? "BAM" : c === "€" ? "EUR" : c;
      }
    }
  }

  if (features.length) result.features = features.join(", ");

  return result;
  } catch {
    return {};
  }
}

function makeDefaultVehicleForm(caption: string): VehicleForm {
  const p = parseVehicleFromCaption(caption);
  return {
    brand: p.brand ?? "",
    model: p.model ?? "",
    year: p.year ?? String(new Date().getFullYear()),
    mileage: p.mileage ?? "0",
    fuel_type: p.fuel_type ?? "diesel",
    transmission: p.transmission ?? "automatic",
    price: p.price ?? "",
    currency: p.currency ?? "BAM",
    color: p.color ?? "",
    engine_size: p.engine_size ?? "",
    power: p.power ?? "",
    doors: p.doors ?? "",
    seats: p.seats ?? "",
    features: p.features ?? "",
    description: caption,
    status: "available",
  };
}

function makeDefaultContentForm(caption: string): ContentForm {
  const safe = caption ?? "";
  const firstLine = safe.split("\n").find((l) => l.trim()) ?? "";
  const title = stripLeadingNonAlpha(fixEncoding(firstLine)).slice(0, 100).trim() || "Bez naslova";
  return { title, category: "announcement", description: safe.slice(0, 500) };
}

// ─── ZIP parser ───────────────────────────────────────────────────────────────

async function parseInstagramZip(file: File): Promise<ParsedPost[]> {
  const zip = await JSZip.loadAsync(file);
  const accountRoot = findAccountRoot(zip);

  // Prefer posts.json (has captions in label_values), fall back to posts_1.json
  const jsonCandidates = [
    `${accountRoot}your_instagram_activity/media/posts.json`,
    `${accountRoot}your_instagram_activity/media/posts_1.json`,
    `${accountRoot}media/posts.json`,
    `${accountRoot}media/posts_1.json`,
    "your_instagram_activity/media/posts.json",
    "posts.json",
    "posts_1.json",
  ];

  let rawData: unknown = null;
  for (const path of jsonCandidates) {
    const f = zip.file(path);
    if (!f) continue;
    try {
      rawData = JSON.parse(await f.async("text"));
      break;
    } catch {
      continue;
    }
  }

  if (!Array.isArray(rawData)) {
    throw new Error(
      "posts.json nije pronađen ili ima neočekivani format. Preuzmite podatke u JSON formatu iz Instagram postavki."
    );
  }

  const posts: ParsedPost[] = [];
  const seenUris = new Set<string>();

  for (const item of rawData as Record<string, unknown>[]) {
    let caption = "";
    const imageUris: string[] = [];

    // Format A: label_values (newer Instagram export — posts.json)
    if (Array.isArray(item.label_values)) {
      for (const lv of item.label_values as Record<string, unknown>[]) {
        if (lv.label === "Caption" && typeof lv.value === "string") {
          caption = fixEncoding(lv.value);
        }
        if (lv.label === "Media" && Array.isArray(lv.media)) {
          for (const m of lv.media as Record<string, unknown>[]) {
            const uri = String(m.uri ?? "");
            if (/\.(jpg|jpeg|png|webp|gif)$/i.test(uri)) imageUris.push(uri);
          }
        }
      }
    }

    // Format B: direct media array (posts_1.json / older format)
    if (!imageUris.length && Array.isArray(item.media)) {
      for (const m of item.media as Record<string, unknown>[]) {
        const uri = String(m.uri ?? "");
        if (/\.(jpg|jpeg|png|webp|gif)$/i.test(uri)) imageUris.push(uri);
      }
      if (imageUris.length) {
        const firstTitle = fixEncoding(String((item.media as Record<string, unknown>[])[0]?.title ?? ""));
        caption = firstTitle;
      }
    }

    if (!imageUris.length) continue;

    // Skip duplicates (same first image = same post)
    const key = imageUris[0];
    if (seenUris.has(key)) continue;
    seenUris.add(key);

    const images: ParsedImage[] = [];
    for (const uri of imageUris) {
      try {
        const entry = zip.file(accountRoot + uri) ?? zip.file(uri);
        if (!entry) continue;
        const blob = await entry.async("blob");
        const previewUrl = URL.createObjectURL(blob);
        images.push({ name: uri.split("/").pop() ?? "image.jpg", blob, previewUrl });
      } catch {
        // skip unreadable image entries
      }
    }

    if (!images.length) continue;

    const timestamp = Number(
      item.timestamp ??
      (Array.isArray(item.media) ? (item.media as Record<string, unknown>[])[0]?.creation_timestamp : 0) ??
      0
    );

    posts.push({
      id: `${timestamp}-${Math.random().toString(36).slice(2)}`,
      caption,
      timestamp,
      images,
    });
  }

  return posts;
}

// ─── Mini carousel (for review cards) ────────────────────────────────────────

function MiniCarousel({ images, idx, onIdx }: { images: ParsedImage[]; idx: number; onIdx: (i: number) => void }) {
  const touchStart = useRef<number | null>(null);
  if (!images.length) return null;

  const prev = () => onIdx(idx === 0 ? images.length - 1 : idx - 1);
  const next = () => onIdx(idx === images.length - 1 ? 0 : idx + 1);

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-secondary aspect-video group"
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
        touchStart.current = null;
      }}
    >
      <img src={images[idx].previewUrl} alt="" className="w-full h-full object-cover select-none" draggable={false} />
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

// ─── Vehicle fields form ──────────────────────────────────────────────────────

function VehicleFields({ form, onChange }: { form: VehicleForm; onChange: (f: Partial<VehicleForm>) => void }) {
  return (
    <div className="space-y-2 pt-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Marka *</Label>
          <Input className="h-8 text-xs" value={form.brand} onChange={(e) => onChange({ brand: e.target.value })} placeholder="Renault" />
        </div>
        <div>
          <Label className="text-xs">Model *</Label>
          <Input className="h-8 text-xs" value={form.model} onChange={(e) => onChange({ model: e.target.value })} placeholder="Captur" />
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
          <Label className="text-xs">Vrata</Label>
          <Input className="h-8 text-xs" type="number" value={form.doors} onChange={(e) => onChange({ doors: e.target.value })} placeholder="5" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Motor</Label>
          <Input className="h-8 text-xs" value={form.engine_size} onChange={(e) => onChange({ engine_size: e.target.value })} placeholder="1.5 dCi" />
        </div>
        <div>
          <Label className="text-xs">Snaga</Label>
          <Input className="h-8 text-xs" value={form.power} onChange={(e) => onChange({ power: e.target.value })} placeholder="85 kW / 115 KS" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
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
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Cijena</Label>
          <Input className="h-8 text-xs" type="number" value={form.price} onChange={(e) => onChange({ price: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Valuta</Label>
          <Select value={form.currency} onValueChange={(v) => onChange({ currency: v ?? form.currency })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BAM">BAM</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Boja</Label>
          <Input className="h-8 text-xs" value={form.color} onChange={(e) => onChange({ color: e.target.value })} placeholder="Plava" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Status</Label>
        <Select value={form.status} onValueChange={(v) => onChange({ status: v ?? form.status })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Dostupno</SelectItem>
            <SelectItem value="upcoming">Uskoro</SelectItem>
            <SelectItem value="reserved">Rezervisano</SelectItem>
            <SelectItem value="sold">Prodano</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Oprema (odvojeno zarezom)</Label>
        <Textarea className="text-xs resize-none" rows={2} value={form.features} onChange={(e) => onChange({ features: e.target.value })} placeholder="Navigacija, Klima, LED svjetla..." />
      </div>
      <div>
        <Label className="text-xs">Opis</Label>
        <Textarea className="text-xs resize-none" rows={3} value={form.description} onChange={(e) => onChange({ description: e.target.value })} />
      </div>
    </div>
  );
}

function ContentFields({ form, onChange, categories }: {
  form: ContentForm;
  onChange: (f: Partial<ContentForm>) => void;
  categories: Record<string, string>;
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
            {Object.entries(categories).map(([k, v]) => (
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

// ─── Constants ────────────────────────────────────────────────────────────────

const NEWS_CATEGORIES: Record<string, string> = {
  new_arrival: "Novo vozilo", upcoming: "Uskoro", announcement: "Obavijest",
  promotion: "Promocija", industry: "Industrija", spotlight: "Spotlight",
};

const OP_CATEGORIES: Record<string, string> = {
  sourcing: "Nabava", import: "Uvoz", transport: "Transport",
  auction: "Aukcija", inspection: "Inspekcija", detailing: "Detailing",
  preparation: "Priprema", delivery: "Isporuka",
};

function slugify(str: string): string {
  return str.toLowerCase()
    .replace(/[čć]/g, "c").replace(/š/g, "s").replace(/ž/g, "z").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

type Phase = "upload" | "review" | "importing" | "done";

interface ImportResult {
  id: string;
  label: string;
  ok: boolean;
  error?: string;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InstagramImportPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [parsing, setParsing] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    return () => {
      for (const e of entries)
        for (const img of e.post.images)
          URL.revokeObjectURL(img.previewUrl);
    };
  }, [entries]);

  const handleZip = useCallback(async (file: File) => {
    if (!file.name.endsWith(".zip")) { toast.error("Odaberite ZIP fajl"); return; }
    setParsing(true);
    try {
      const posts = await parseInstagramZip(file);
      if (!posts.length) { toast.error("Nisu pronađeni postovi sa slikama"); setParsing(false); return; }
      setEntries(posts.map((post) => ({
        post,
        destination: "vehicle" as Destination,
        vehicleForm: makeDefaultVehicleForm(post.caption),
        newsForm: makeDefaultContentForm(post.caption),
        operationForm: makeDefaultContentForm(post.caption),
        imageIdx: 0,
      })));
      setPhase("review");
      toast.success(`${posts.length} postova pronađeno`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška pri parsiranju ZIP fajla");
    } finally {
      setParsing(false);
    }
  }, []);

  const updateEntry = (id: string, update: Partial<Entry>) =>
    setEntries((prev) => prev.map((e) => e.post.id === id ? { ...e, ...update } : e));

  const updateVehicle = (id: string, f: Partial<VehicleForm>) =>
    setEntries((prev) => prev.map((e) => e.post.id === id ? { ...e, vehicleForm: { ...e.vehicleForm, ...f } } : e));

  const updateNews = (id: string, f: Partial<ContentForm>) =>
    setEntries((prev) => prev.map((e) => e.post.id === id ? { ...e, newsForm: { ...e.newsForm, ...f } } : e));

  const updateOperation = (id: string, f: Partial<ContentForm>) =>
    setEntries((prev) => prev.map((e) => e.post.id === id ? { ...e, operationForm: { ...e.operationForm, ...f } } : e));

  const toImport = entries.filter((e) => e.destination !== "skip");

  async function uploadImages(images: ParsedImage[], bucket: string, prefix: string): Promise<string[]> {
    const urls: string[] = [];
    for (const img of images) {
      const ext = img.name.split(".").pop() ?? "jpg";
      const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, img.blob, { upsert: true });
      if (error) throw new Error(`Upload greška: ${error.message}`);
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
      setProgress(Math.round((i / toImport.length) * 100));

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
            color: vf.color || null,
            engine_size: vf.engine_size || null,
            power: vf.power || null,
            doors: vf.doors ? Number(vf.doors) : null,
            seats: vf.seats ? Number(vf.seats) : null,
            description: vf.description.trim() || entry.post.caption,
            features: (vf.features ?? "").split(",").map((f) => f.trim()).filter(Boolean),
            status: vf.status,
            images: imageUrls,
            videos: [],
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
        const label = entry.destination === "vehicle"
          ? `${entry.vehicleForm.brand} ${entry.vehicleForm.model}`.trim() || "Vozilo"
          : entry.destination === "news" ? entry.newsForm.title || "Vijest"
          : entry.operationForm.title || "Operacija";
        importResults.push({ id: entry.post.id, label, ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    setProgress(100);
    setResults(importResults);
    setPhase("done");
  };

  // ── Upload phase ─────────────────────────────────────────────────────────────
  if (phase === "upload") {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <GalleryThumbnails className="w-6 h-6" /> Instagram Uvoz
          </h1>
          <p className="text-sm text-muted-foreground">
            Uvezite slike i opise vozila iz Instagram ZIP izvoza
          </p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleZip(f); }}
        >
          <input ref={fileInputRef} type="file" accept=".zip" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleZip(f); }} />
          {parsing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-sm font-medium">Parsiranje ZIP fajla i učitavanje slika...</p>
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
          <h2 className="font-bold text-sm mb-3">Kako preuzeti Instagram podatke?</h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Otvorite Instagram → <strong className="text-foreground">Profil → ☰ Postavke i aktivnost</strong></li>
            <li>Idite na <strong className="text-foreground">Vaše aktivnosti → Preuzmite vaše informacije</strong></li>
            <li>Odaberite profil → <strong className="text-foreground">Preuzmi ili prenesi informacije</strong></li>
            <li>Odaberite <strong className="text-foreground">Postovi</strong> i format: <strong className="text-foreground">JSON</strong></li>
            <li>Kliknite <strong className="text-foreground">Kreirajte fajlove</strong>, sačekajte email i preuzmite ZIP</li>
          </ol>
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground">
            <strong className="text-foreground">Šta se automatski detektuje:</strong> marka, model, godište, kilometraža, gorivo, mjenjač, boja, motor, snaga, cijena, valuta i lista opreme — direktno iz teksta objava.
          </div>
        </div>
      </div>
    );
  }

  // ── Done phase ───────────────────────────────────────────────────────────────
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
            {successes.length} uspješno uvezeno · {failures.length} grešaka
          </p>
        </div>
        <div className="space-y-2 mb-6">
          {results.map((r) => (
            <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border ${r.ok ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
              {r.ok ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.label}</p>
                {r.error && <p className="text-xs text-red-400">{r.error}</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { setPhase("upload"); setEntries([]); setResults([]); }}>Novi uvoz</Button>
          <Button variant="outline" onClick={() => setPhase("review")}>Nazad na pregled</Button>
        </div>
      </div>
    );
  }

  // ── Importing phase ───────────────────────────────────────────────────────────
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

  // ── Review phase ──────────────────────────────────────────────────────────────
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

      {/* Quick select all */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["vehicle", "news", "operation", "skip"] as Destination[]).map((d) => (
          <button key={d}
            onClick={() => setEntries((prev) => prev.map((e) => ({ ...e, destination: d })))}
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors flex items-center gap-1.5">
            {destIcon[d]} Sve → {destLabel[d]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {entries.map((entry) => (
          <div key={entry.post.id}
            className={`rounded-2xl border overflow-hidden ${entry.destination === "skip" ? "border-border opacity-40" : "border-border"}`}>

            <MiniCarousel images={entry.post.images} idx={entry.imageIdx}
              onIdx={(i) => updateEntry(entry.post.id, { imageIdx: i })} />

            <div className="p-3 space-y-3">
              {/* Caption preview */}
              {entry.post.caption && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {entry.post.caption}
                </p>
              )}

              {/* Date + image count */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/60">
                  {entry.post.timestamp ? new Date(entry.post.timestamp * 1000).toLocaleDateString("bs-BA") : "—"}
                </span>
                {entry.post.images.length > 1 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                    {entry.post.images.length} slika
                  </Badge>
                )}
              </div>

              {/* Destination selector */}
              <div className="grid grid-cols-4 gap-1">
                {(["vehicle", "news", "operation", "skip"] as Destination[]).map((d) => (
                  <button key={d}
                    onClick={() => updateEntry(entry.post.id, { destination: d })}
                    className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg border text-xs font-medium transition-colors ${
                      entry.destination === d
                        ? d === "skip"
                          ? "border-red-500/50 bg-red-500/10 text-red-400"
                          : "border-primary/50 bg-primary/10 text-primary"
                        : "border-border hover:bg-secondary text-muted-foreground"
                    }`}>
                    {destIcon[d]}
                    <span className="text-[10px] leading-none">{destLabel[d]}</span>
                  </button>
                ))}
              </div>

              {/* Per-destination form */}
              {entry.destination === "vehicle" && (
                <VehicleFields form={entry.vehicleForm} onChange={(f) => updateVehicle(entry.post.id, f)} />
              )}
              {entry.destination === "news" && (
                <ContentFields form={entry.newsForm} onChange={(f) => updateNews(entry.post.id, f)} categories={NEWS_CATEGORIES} />
              )}
              {entry.destination === "operation" && (
                <ContentFields form={entry.operationForm} onChange={(f) => updateOperation(entry.post.id, f)} categories={OP_CATEGORIES} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky import bar */}
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
