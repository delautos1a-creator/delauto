"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface SettingDef {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
}

const SETTINGS: SettingDef[] = [
  { key: "site_name",             label: "Naziv kompanije",         placeholder: "Del Auto D.O.O." },
  { key: "site_phone",            label: "Telefon",                  placeholder: "+387 61 199 645" },
  { key: "site_email",            label: "Email",                    placeholder: "info@delauto.ba" },
  { key: "site_instagram",        label: "Instagram URL",            placeholder: "https://www.instagram.com/..." },
  { key: "site_facebook",         label: "Facebook URL",             placeholder: "https://www.facebook.com/..." },
  { key: "site_olx",              label: "OLX URL",                  placeholder: "https://olx.ba/shops/..." },
  { key: "site_address",          label: "Adresa ureda",             placeholder: "Paromlinska 53e, 71000 Sarajevo, BiH", multiline: true },
  { key: "site_address_showroom", label: "Adresa salona/praonica",   placeholder: "Džemala Bijedića 168, 71000 Sarajevo, BiH", multiline: true },
  { key: "site_working_hours",    label: "Radno vrijeme",            placeholder: "Pon – Pet: 09:00 – 18:00\nSub: 09:00 – 14:00\nNed: Zatvoreno", multiline: true, hint: "Svaki red = jedan dan ili period. Prikazuje se na kontakt stranici i footeru." },
  { key: "site_maps_office",      label: "Google Maps URL — Ured",   placeholder: "https://maps.google.com/maps?q=...&output=embed", hint: "Kopirajte URL iz Google Maps embed linka (dugme Dijeli → Ugradi). Samo src= vrijednost." },
  { key: "site_maps_showroom",    label: "Google Maps URL — Salon",  placeholder: "https://maps.google.com/maps?q=...&output=embed", hint: "Isto kao gore, za lokaciju salona." },
];

export default function AdminSettings() {
  const supabase = createClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("site_settings").select("key, value").then(({ data }) => {
      const map: Record<string, string> = {};
      (data ?? []).forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
      setValues(map);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    for (const def of SETTINGS) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("site_settings") as any).upsert(
        { key: def.key, value: values[def.key] ?? "", updated_at: now },
        { onConflict: "key" }
      );
      if (error) console.error("Save error", def.key, error.message);
    }
    setSaving(false);
    toast.success("Postavke sačuvane");
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /></div>
        <div className="space-y-4 max-w-2xl">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black">Postavke</h1>
        <p className="text-sm text-muted-foreground">Kontakt info, radno vrijeme i mape — sve što se prikazuje na sajtu</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Group: basic info */}
        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Osnovne informacije</h2>
            {SETTINGS.slice(0, 6).map((def) => (
              <div key={def.key} className="space-y-1">
                <Label>{def.label}</Label>
                <Input
                  value={values[def.key] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [def.key]: e.target.value }))}
                  placeholder={def.placeholder}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Group: addresses + hours */}
        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Adrese i radno vrijeme</h2>
            {SETTINGS.slice(6, 9).map((def) => (
              <div key={def.key} className="space-y-1">
                <Label>{def.label}</Label>
                <Textarea
                  rows={def.key === "site_working_hours" ? 4 : 2}
                  value={values[def.key] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [def.key]: e.target.value }))}
                  placeholder={def.placeholder}
                  className="resize-none text-sm"
                />
                {def.hint && <p className="text-xs text-muted-foreground">{def.hint}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Group: maps */}
        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Google Maps</h2>
            <p className="text-xs text-muted-foreground">
              U Google Maps otvorite lokaciju → Dijeli → Ugradi kartu → kopirajte URL koji se nalazi unutar <code className="bg-secondary px-1 rounded">src="..."</code>
            </p>
            {SETTINGS.slice(9).map((def) => (
              <div key={def.key} className="space-y-1">
                <Label>{def.label}</Label>
                <Input
                  value={values[def.key] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [def.key]: e.target.value }))}
                  placeholder={def.placeholder}
                  className="font-mono text-xs"
                />
                {def.hint && <p className="text-xs text-muted-foreground">{def.hint}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? "Čuvanje..." : "Sačuvaj sve postavke"}
        </Button>
      </div>
    </div>
  );
}
