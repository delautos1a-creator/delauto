"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SiteSetting } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings } from "lucide-react";
import { toast } from "sonner";

const SETTING_LABELS: Record<string, string> = {
  site_name: "Naziv sajta",
  site_phone: "Telefon",
  site_email: "Email",
  site_address: "Adresa",
  site_instagram: "Instagram URL",
  site_facebook: "Facebook URL",
  site_working_hours: "Radno vrijeme",
};

export default function AdminSettings() {
  const supabase = createClient();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("site_settings").select("*").then(({ data }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typed = (data ?? []) as any[];
    setSettings(typed);
    const map: Record<string, string> = {};
    typed.forEach((s) => (map[s.key] = s.value));
    setValues(map);
    setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    for (const s of settings) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase
        .from("site_settings")
        .update({ value: values[(s as any).key] ?? "", updated_at: new Date().toISOString() } as any)
        .eq("key", (s as any).key);
    }
    setSaving(false);
    toast.success("Postavke sačuvane");
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black">Postavke</h1>
        <p className="text-sm text-muted-foreground">Opšte postavke sajta</p>
      </div>

      <Card className="border-border max-w-xl">
        <CardContent className="p-6 space-y-4">
          {settings.map((s) => (
            <div key={s.key} className="space-y-1">
              <Label>{SETTING_LABELS[s.key] ?? s.key}</Label>
              <Input
                value={values[s.key] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [s.key]: e.target.value }))}
              />
            </div>
          ))}
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Čuvanje..." : "Sačuvaj postavke"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
