import { createClient } from "@/lib/supabase/server";

export interface SiteSettings {
  site_name: string;
  site_phone: string;
  site_email: string;
  site_address: string;
  site_address_showroom: string;
  site_instagram: string;
  site_facebook: string;
  site_olx: string;
  site_working_hours: string;
  site_maps_office: string;
  site_maps_showroom: string;
}

const DEFAULTS: SiteSettings = {
  site_name:             "Del Auto D.O.O.",
  site_phone:            "+387 61 199 645",
  site_email:            "info@delauto.ba",
  site_address:          "Paromlinska 53e, 71000 Sarajevo, BiH",
  site_address_showroom: "Džemala Bijedića 168, 71000 Sarajevo, BiH",
  site_instagram:        "https://www.instagram.com/delauto_sarajevo/",
  site_facebook:         "",
  site_olx:              "https://olx.ba/shops/DelAuto/",
  site_working_hours:    "Pon – Pet: 09:00 – 18:00\nSub: 09:00 – 14:00\nNed: Zatvoreno",
  site_maps_office:      "https://maps.google.com/maps?q=Paromlinska+53e,+Sarajevo,+Bosnia+and+Herzegovina&output=embed&z=17&hl=bs",
  site_maps_showroom:    "https://maps.google.com/maps?q=43.846429,18.339670&output=embed&z=17&hl=bs",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");
  const map: Record<string, string> = {};
  (data ?? []).forEach((row: { key: string; value: string }) => {
    if (row.value) map[row.key] = row.value;
  });
  return { ...DEFAULTS, ...map } as SiteSettings;
}
